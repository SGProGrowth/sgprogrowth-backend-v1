import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  BatchImportJobStatus,
  BatchImportRowStatus,
} from '@prisma/client'
import type { Express } from 'express'
import { BatchImportExecuteDto, BatchImportPreviewDto } from '../../common/dto/batch.dto'
import { PrismaService } from '../../prisma/prisma.module'
import { NotificationMailService } from '../mail/notification-mail.service'
import { BatchesService } from './batches.service'
import { QueueSchedulerService } from '../../queue/queue-scheduler.service'

type ImportRow = Record<string, string>

const TEMPLATE_COLUMNS = ['full_name', 'email', 'course_slug', 'batch_name', 'phone', 'notes']

@Injectable()
export class BatchImportService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private batchesService: BatchesService,
    private notificationMail: NotificationMailService,
    private queueScheduler: QueueSchedulerService,
  ) {}

  getTemplateCsv() {
    const header = TEMPLATE_COLUMNS.join(',')
    const sample = [
      'Neha Sharma,neha.sharma@example.com,aws-solutions-architect,AWS SAA — June 2026,+91-9876543210,',
      'Vikram Singh,vikram.s@example.com,it-project-management,IT PM — May 2026,,',
    ].join('\n')
    return `${header}\n${sample}\n`
  }

  async previewImport(
    instructorId: string,
    file: Express.Multer.File,
    dto: BatchImportPreviewDto,
  ) {
    const orgId = await this.defaultOrgId()
    const rows = await this.parseFile(file)
    if (!rows.length) throw new BadRequestException('File is empty')

    const job = await this.prisma.batchImportJob.create({
      data: {
        organizationId: orgId,
        instructorId,
        batchId: dto.defaultBatchId,
        fileName: file.originalname,
        status: BatchImportJobStatus.preview,
        totalRows: rows.length,
        columnMapping: (dto.columnMapping ?? {}) as object,
      },
    })

    let valid = 0
    let warnings = 0
    let errors = 0
    const previewRows = []

    for (let i = 0; i < rows.length; i++) {
      const rowNumber = i + 1
      const parsed = this.normalizeRow(rows[i], dto.columnMapping)
      const validation = await this.validateRow(parsed, instructorId, orgId, dto)
      previewRows.push(
        await this.prisma.batchImportRow.create({
          data: {
            jobId: job.id,
            rowNumber,
            rawData: rows[i] as object,
            parsedData: parsed as object,
            status: validation.status,
            message: validation.message,
          },
        }),
      )
      if (validation.status === BatchImportRowStatus.valid) valid++
      else if (validation.status === BatchImportRowStatus.warning) warnings++
      else errors++
    }

    await this.prisma.batchImportJob.update({
      where: { id: job.id },
      data: { successCount: valid, warningCount: warnings, failureCount: errors },
    })

    return {
      jobId: job.id,
      totalRows: rows.length,
      validCount: valid,
      warningCount: warnings,
      errorCount: errors,
      rows: previewRows.map((r) => ({
        row: r.rowNumber,
        name: (r.parsedData as ImportRow).full_name ?? '',
        email: (r.parsedData as ImportRow).email ?? '',
        course: (r.parsedData as ImportRow).course_slug ?? '',
        batch: (r.parsedData as ImportRow).batch_name ?? '',
        status: r.status,
        message: r.message,
      })),
    }
  }

  async executeImport(instructorId: string, dto: BatchImportExecuteDto) {
    const job = await this.prisma.batchImportJob.findUnique({
      where: { id: dto.jobId },
      include: { rows: true },
    })
    if (!job || job.instructorId !== instructorId) throw new NotFoundException('Import job not found')

    const queueThreshold = Number(this.config.get<string>('BATCH_IMPORT_QUEUE_THRESHOLD') ?? 50)
    if (
      job.rows.length >= queueThreshold &&
      this.config.get<string>('BATCH_IMPORT_QUEUE_ENABLED') === 'true'
    ) {
      await this.queueScheduler.enqueueBatchImport(job.id, instructorId)
      return { queued: true, jobId: job.id, message: 'Import queued for background processing' }
    }

    return this.processImportJob(instructorId, dto)
  }

  async executeImportJob(jobId: string, instructorId: string) {
    return this.processImportJob(instructorId, { jobId, partialImport: true })
  }

  private async processImportJob(instructorId: string, dto: BatchImportExecuteDto) {
    const job = await this.prisma.batchImportJob.findUnique({
      where: { id: dto.jobId },
      include: { rows: true },
    })
    if (!job || job.instructorId !== instructorId) throw new NotFoundException('Import job not found')
    if (job.status !== BatchImportJobStatus.preview) {
      throw new BadRequestException('Import job is not in preview state')
    }

    await this.prisma.batchImportJob.update({
      where: { id: job.id },
      data: { status: BatchImportJobStatus.processing },
    })

    const toImport = job.rows.filter((r) => {
      if (dto.rowNumbers?.length) return dto.rowNumbers.includes(r.rowNumber)
      return r.status === BatchImportRowStatus.valid || (dto.partialImport && r.status === BatchImportRowStatus.warning)
    })

    let success = 0
    let failed = 0
    const failures: Array<{ row: number; message: string }> = []

    for (const row of toImport) {
      try {
        const parsed = row.parsedData as ImportRow
        const courseSlug = parsed.course_slug?.trim()
        const batchName = parsed.batch_name?.trim()
        if (!courseSlug) throw new Error('course_slug required')

        const orgId = job.organizationId
        const course = await this.prisma.course.findFirst({
          where: { organizationId: orgId, slug: courseSlug, instructorId },
        })
        if (!course) throw new Error('Course not found or access denied')

        let batchId = job.batchId ?? undefined
        if (batchName) {
          const batch = await this.prisma.batch.findFirst({
            where: { courseId: course.id, name: { equals: batchName, mode: 'insensitive' } },
          })
          if (!batch) throw new Error(`Batch "${batchName}" not found`)
          batchId = batch.id
        }
        if (!batchId) throw new Error('batch required')

        const result = await this.batchesService.addStudentToBatch(instructorId, batchId, {
          email: parsed.email?.trim(),
          name: parsed.full_name?.trim(),
          createAccount: true,
        })

        await this.prisma.batchImportRow.update({
          where: { id: row.id },
          data: {
            status: BatchImportRowStatus.imported,
            studentId: result.id,
          },
        })
        success++
      } catch (e) {
        failed++
        const message = e instanceof Error ? e.message : 'Import failed'
        failures.push({ row: row.rowNumber, message })
        await this.prisma.batchImportRow.update({
          where: { id: row.id },
          data: { status: BatchImportRowStatus.error, message },
        })
      }
    }

    const criticalFailure = failed > 0 && !dto.partialImport && success === 0
    await this.prisma.batchImportJob.update({
      where: { id: job.id },
      data: {
        status: criticalFailure ? BatchImportJobStatus.failed : BatchImportJobStatus.completed,
        successCount: success,
        failureCount: failed,
        completedAt: new Date(),
        summary: { failures, success, failed } as object,
      },
    })

    const instructor = await this.prisma.user.findUnique({
      where: { id: instructorId },
      include: { instructorProfile: true },
    })

    if (instructor) {
      void this.notificationMail.sendBatchImportCompleted({
        userId: instructorId,
        email: instructor.email,
        name: instructor.instructorProfile?.displayName ?? instructor.email,
        fileName: job.fileName,
        successCount: success,
        failureCount: failed,
        organizationId: job.organizationId,
      })
    }

    return {
      jobId: job.id,
      successCount: success,
      failureCount: failed,
      failures,
      status: criticalFailure ? 'failed' : 'completed',
    }
  }

  async getImportJob(instructorId: string, jobId: string) {
    const job = await this.prisma.batchImportJob.findUnique({
      where: { id: jobId },
      include: { rows: { orderBy: { rowNumber: 'asc' } } },
    })
    if (!job || job.instructorId !== instructorId) throw new NotFoundException('Import job not found')
    return job
  }

  private async defaultOrgId() {
    const slug = this.config.get<string>('DEFAULT_ORGANIZATION_SLUG') ?? 'sg-pro-growth'
    const org = await this.prisma.organization.findUnique({ where: { slug } })
    if (!org) throw new Error('Default organization not configured')
    return org.id
  }

  private async parseFile(file: Express.Multer.File): Promise<ImportRow[]> {
    const name = file.originalname.toLowerCase()
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      const XLSX = await import('xlsx')
      const workbook = XLSX.read(file.buffer, { type: 'buffer' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      if (!sheet) throw new BadRequestException('Excel file has no sheets')
      return XLSX.utils.sheet_to_json<ImportRow>(sheet, { defval: '' })
    }
    return this.parseCsv(file.buffer.toString('utf8'))
  }

  private parseCsv(text: string): ImportRow[] {
    const lines = text.split(/\r?\n/).filter((l) => l.trim())
    if (lines.length < 2) return []
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
    return lines.slice(1).map((line) => {
      const cols = line.split(',')
      const row: ImportRow = {}
      headers.forEach((h, i) => {
        row[h] = (cols[i] ?? '').trim()
      })
      return row
    })
  }

  private normalizeRow(row: ImportRow, mapping?: Record<string, string>): ImportRow {
    if (!mapping || !Object.keys(mapping).length) return row
    const out: ImportRow = { ...row }
    for (const [target, source] of Object.entries(mapping)) {
      if (source && row[source] !== undefined) out[target] = row[source]
    }
    return out
  }

  private async validateRow(
    parsed: ImportRow,
    instructorId: string,
    orgId: string,
    dto: BatchImportPreviewDto,
  ): Promise<{ status: BatchImportRowStatus; message?: string }> {
    const email = parsed.email?.trim().toLowerCase()
    const courseSlug = parsed.course_slug?.trim() || dto.defaultCourseSlug
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { status: BatchImportRowStatus.error, message: 'Invalid email' }
    }
    if (!parsed.full_name?.trim()) {
      return { status: BatchImportRowStatus.error, message: 'full_name required' }
    }
    if (!courseSlug) {
      return { status: BatchImportRowStatus.error, message: 'course_slug required' }
    }

    const course = await this.prisma.course.findFirst({
      where: { organizationId: orgId, slug: courseSlug, instructorId },
    })
    if (!course) {
      return { status: BatchImportRowStatus.error, message: 'Course not found or access denied' }
    }

    const user = await this.prisma.user.findUnique({ where: { email } })
    if (user) {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: { studentId_courseId: { studentId: user.id, courseId: course.id } },
      })
      if (enrollment) {
        return {
          status: BatchImportRowStatus.warning,
          message: 'Already enrolled in this course',
        }
      }
    }

    return { status: BatchImportRowStatus.valid }
  }
}
