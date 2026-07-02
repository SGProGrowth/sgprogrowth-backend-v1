import { BadRequestException, Injectable } from '@nestjs/common'
import { QuestionDifficulty, QuestionType } from '@prisma/client'
import type { Express } from 'express'
import { CreateQuestionDto, ImportReportDto, QuestionsQueryDto } from '../../common/dto/question.dto'
import { QuestionsService } from './questions.service'
import { parseQuestionType } from './question.mapper'

type ImportRow = Record<string, string>

@Injectable()
export class QuestionsImportExportService {
  constructor(private questions: QuestionsService) {}

  async importCsv(instructorId: string, file: Express.Multer.File, email: string, name: string): Promise<ImportReportDto> {
    const text = file.buffer.toString('utf8')
    const rows = this.parseCsv(text)
    return this.processRows(instructorId, rows, email, name)
  }

  async importExcel(instructorId: string, file: Express.Multer.File, email: string, name: string): Promise<ImportReportDto> {
    const XLSX = await import('xlsx')
    const workbook = XLSX.read(file.buffer, { type: 'buffer' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    if (!sheet) throw new BadRequestException('Excel file has no sheets')
    const rows = XLSX.utils.sheet_to_json<ImportRow>(sheet, { defval: '' })
    return this.processRows(instructorId, rows, email, name)
  }

  async exportCsv(instructorId: string, query: QuestionsQueryDto): Promise<string> {
    const rows = await this.questions.exportRows(instructorId, query)
    const header = [
      'title',
      'question_text',
      'type',
      'difficulty',
      'marks',
      'negative_marks',
      'category',
      'subject',
      'tags',
      'explanation',
      'estimated_seconds',
    ]
    const lines = [header.join(',')]
    for (const q of rows) {
      lines.push(
        [
          this.escapeCsv(q.title ?? ''),
          this.escapeCsv(q.question),
          q.type,
          q.difficulty,
          q.marks,
          q.negativeMarks ?? '',
          this.escapeCsv(q.category),
          this.escapeCsv(q.subject ?? ''),
          this.escapeCsv((q.tags ?? []).join('|')),
          '',
          q.estimatedSeconds ?? '',
        ].join(','),
      )
    }
    return lines.join('\n')
  }

  async exportExcel(instructorId: string, query: QuestionsQueryDto): Promise<Buffer> {
    const XLSX = await import('xlsx')
    const rows = await this.questions.exportRows(instructorId, query)
    const data = rows.map((q) => ({
      title: q.title ?? '',
      question_text: q.question,
      type: q.type,
      difficulty: q.difficulty,
      marks: q.marks,
      negative_marks: q.negativeMarks ?? '',
      category: q.category,
      subject: q.subject ?? '',
      tags: (q.tags ?? []).join('|'),
      explanation: '',
      estimated_seconds: q.estimatedSeconds ?? '',
    }))
    const sheet = XLSX.utils.json_to_sheet(data)
    const book = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(book, sheet, 'Questions')
    return XLSX.write(book, { type: 'buffer', bookType: 'xlsx' }) as Buffer
  }

  private async processRows(
    instructorId: string,
    rows: ImportRow[],
    email: string,
    name: string,
  ): Promise<ImportReportDto> {
    const report: ImportReportDto = { imported: 0, failed: 0, errors: [] }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2
      try {
        const dto = this.rowToDto(row)
        await this.questions.createFromImport(instructorId, dto)
        report.imported += 1
      } catch (err) {
        report.failed += 1
        report.errors.push({
          row: rowNum,
          message: err instanceof Error ? err.message : String(err),
        })
      }
    }

    void this.questions.notifyImportComplete(instructorId, email, name, report.imported, report.failed)
    return report
  }

  private rowToDto(row: ImportRow): CreateQuestionDto {
    const questionText = (row.question_text ?? row.question ?? row.questionText ?? '').trim()
    if (!questionText) throw new BadRequestException('question_text is required')

    const typeRaw = row.type ?? 'multiple_choice'
    const type = parseQuestionType(typeRaw)

    const tagsRaw = row.tags ?? ''
    const tags = tagsRaw.split(/[|,]/).map((t) => t.trim()).filter(Boolean)

    const optionsRaw = row.options ?? ''
    const options = this.parseOptions(optionsRaw, type, row.correct_answer ?? row.correctAnswer ?? '')

    return {
      title: row.title?.trim() || undefined,
      questionText,
      type,
      explanation: row.explanation?.trim(),
      difficulty: (row.difficulty?.trim().toLowerCase() as QuestionDifficulty) || 'medium',
      marks: row.marks ? Number(row.marks) : row.points ? Number(row.points) : 1,
      negativeMarks: row.negative_marks ? Number(row.negative_marks) : undefined,
      estimatedSeconds: row.estimated_seconds ? Number(row.estimated_seconds) : undefined,
      category: row.category?.trim(),
      subject: row.subject?.trim(),
      tags,
      options: options.length ? options : undefined,
    }
  }

  private parseOptions(raw: string, type: QuestionType, correct: string) {
    if (!raw.trim()) return []
    const parts = raw.split('|').map((p) => p.trim()).filter(Boolean)
    const correctSet = new Set(
      correct.split(/[|,]/).map((c) => c.trim()).filter(Boolean),
    )

    return parts.map((part, i) => {
      const match = part.match(/^([A-Za-z])[:.)-]\s*(.+)$/)
      const label = match?.[1]?.toUpperCase()
      const text = match?.[2]?.trim() ?? part
      return {
        label,
        text,
        isCorrect: label ? correctSet.has(label) : correctSet.has(text),
        sortOrder: i,
      }
    })
  }

  private parseCsv(text: string): ImportRow[] {
    const lines = text.split(/\r?\n/).filter((l) => l.trim())
    if (lines.length < 2) return []
    const headers = this.splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase())
    return lines.slice(1).map((line) => {
      const values = this.splitCsvLine(line)
      const row: ImportRow = {}
      headers.forEach((h, i) => {
        row[h] = values[i] ?? ''
      })
      return row
    })
  }

  private splitCsvLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else inQuotes = !inQuotes
      } else if (ch === ',' && !inQuotes) {
        result.push(current)
        current = ''
      } else current += ch
    }
    result.push(current)
    return result
  }

  private escapeCsv(value: string) {
    if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
    return value
  }
}
