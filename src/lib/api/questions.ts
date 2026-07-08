import { authorizedDownload, authorizedFetch, authorizedMultipart } from './client'
import type { PaginatedResponse } from './courses'
import type { QuestionBankItem, QuestionDifficulty, QuestionType } from '../../data/instructorData'

export interface QuestionDetail extends Omit<QuestionBankItem, 'type'> {
  title?: string
  explanation?: string
  marks: number
  negativeMarks?: number | null
  estimatedSeconds?: number | null
  subject?: string | null
  topic?: string | null
  codeSnippet?: string | null
  type: string
  options?: Array<{
    id?: string
    label?: string | null
    text: string
    isCorrect?: boolean
    sortOrder?: number
  }>
  currentVersion?: number
}

export interface CreateQuestionInput {
  title?: string
  questionText: string
  type: string
  explanation?: string
  difficulty?: QuestionDifficulty
  marks?: number
  negativeMarks?: number
  estimatedSeconds?: number
  category?: string
  subject?: string
  tags?: string[]
  options?: Array<{ label?: string; text: string; isCorrect?: boolean }>
}

const TYPE_TO_API: Record<string, string> = {
  'multiple-choice': 'multiple_choice',
  'multiple-choice-multi': 'multiple_choice_multi',
  'true-false': 'true_false',
  'short-answer': 'short_answer',
  essay: 'essay',
  'long-answer': 'long_answer',
  'fill-blank': 'fill_blank',
  matching: 'matching',
  ordering: 'ordering',
}

export function fetchQuestions(params?: {
  page?: number
  pageSize?: number
  q?: string
  category?: string
  difficulty?: QuestionDifficulty
  type?: string
  course?: string
  tag?: string
  status?: 'active' | 'archived'
  sort?: string
}) {
  const qs = new URLSearchParams()
  if (params?.page) qs.set('page', String(params.page))
  if (params?.pageSize) qs.set('pageSize', String(params.pageSize))
  if (params?.q) qs.set('q', params.q)
  if (params?.category) qs.set('category', params.category)
  if (params?.difficulty) qs.set('difficulty', params.difficulty)
  if (params?.type) qs.set('type', params.type)
  if (params?.course) qs.set('course', params.course)
  if (params?.tag) qs.set('tag', params.tag)
  if (params?.status) qs.set('status', params.status)
  if (params?.sort) qs.set('sort', params.sort)
  const query = qs.toString()
  return authorizedFetch(`/questions${query ? `?${query}` : ''}`) as Promise<PaginatedResponse<QuestionDetail>>
}

export function createQuestion(input: CreateQuestionInput) {
  return authorizedFetch('/questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...input,
      type: TYPE_TO_API[input.type] ?? input.type.replace(/-/g, '_'),
    }),
  }) as Promise<QuestionDetail>
}

export function updateQuestion(id: string, input: Partial<CreateQuestionInput>) {
  const body = { ...input }
  if (input.type) {
    body.type = TYPE_TO_API[input.type as QuestionType] ?? input.type.replace(/-/g, '_')
  }
  return authorizedFetch(`/questions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function deleteQuestion(id: string) {
  return authorizedFetch(`/questions/${id}`, { method: 'DELETE' })
}

export function archiveQuestion(id: string) {
  return authorizedFetch(`/questions/${id}/archive`, { method: 'POST' })
}

export function restoreQuestion(id: string) {
  return authorizedFetch(`/questions/${id}/restore`, { method: 'POST' })
}

export function duplicateQuestion(id: string) {
  return authorizedFetch(`/questions/${id}/duplicate`, { method: 'POST' }) as Promise<QuestionDetail>
}

export function previewQuestion(id: string) {
  return authorizedFetch(`/questions/${id}/preview`) as Promise<QuestionDetail>
}

export function importQuestionsCsv(file: File) {
  const form = new FormData()
  form.append('file', file)
  return authorizedMultipart('/questions/import/csv', 'POST', form) as Promise<{ imported: number; failed: number; errors: Array<{ row: number; message: string }> }>
}

export function importQuestionsExcel(file: File) {
  const form = new FormData()
  form.append('file', file)
  return authorizedMultipart('/questions/import/excel', 'POST', form) as Promise<{ imported: number; failed: number; errors: Array<{ row: number; message: string }> }>
}

export function importQuestionsFile(file: File) {
  const name = file.name.toLowerCase()
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) return importQuestionsExcel(file)
  return importQuestionsCsv(file)
}

export async function exportQuestionsExcel(params?: { status?: string }) {
  const qs = params?.status ? `?status=${params.status}` : ''
  return authorizedDownload(`/questions/export/excel${qs}`, 'questions.xlsx')
}

export async function exportQuestionsCsv(params?: { status?: string }) {
  const qs = params?.status ? `?status=${params.status}` : ''
  return authorizedDownload(`/questions/export/csv${qs}`, 'questions.csv')
}

const API_TO_TYPE: Record<string, QuestionType> = {
  multiple_choice: 'multiple-choice',
  multiple_choice_multi: 'multiple-choice-multi',
  true_false: 'true-false',
  short_answer: 'short-answer',
  essay: 'essay',
  long_answer: 'long-answer',
  fill_blank: 'fill-blank',
  matching: 'matching',
  ordering: 'ordering',
}

export function mapApiQuestion(row: QuestionDetail): QuestionBankItem {
  const rawType = row.type
  const normalizedType =
    API_TO_TYPE[rawType] ??
    (rawType.includes('_') ? API_TO_TYPE[rawType] : (rawType as QuestionType))
  return {
    id: row.id,
    instructorId: row.instructorId,
    question: row.question,
    type: normalizedType ?? (rawType.replace(/_/g, '-') as QuestionType),
    category: row.category,
    difficulty: row.difficulty,
    courseTitle: row.courseTitle,
    tags: row.tags ?? [],
    usedIn: row.usedIn ?? 0,
    points: row.points ?? row.marks,
    status: row.status,
  }
}
