import { authorizedDownload, authorizedFetch, authorizedMultipart } from './client'

export interface BatchRecord {
  id: string
  batchCode: string
  name: string
  description?: string | null
  courseId: string
  courseTitle: string
  startDate: string
  endDate: string
  schedule: string
  maxCapacity: number
  studentsCount: number
  status: string
  visibility?: string
  published?: boolean
  completionRate: number
  thumbnailUrl?: string | null
  instructorId?: string
  instructor?: string
  progress?: number
  batchmates?: Array<{ name: string; initials: string; progress: number }>
  nextSession?: string
}

export interface BatchImportPreviewRow {
  row: number
  name: string
  email: string
  course: string
  batch: string
  status: 'valid' | 'warning' | 'error' | 'imported' | 'skipped'
  message?: string | null
}

export interface BatchImportPreviewResult {
  jobId: string
  totalRows: number
  validCount: number
  warningCount: number
  errorCount: number
  rows: BatchImportPreviewRow[]
}

export interface BatchImportExecuteResult {
  jobId: string
  successCount: number
  failureCount: number
  failures: Array<{ row: number; message: string }>
  status: string
}

export function fetchInstructorBatches(params?: { courseSlug?: string; status?: string; search?: string }) {
  const qs = new URLSearchParams()
  if (params?.courseSlug) qs.set('courseSlug', params.courseSlug)
  if (params?.status) qs.set('status', params.status)
  if (params?.search) qs.set('search', params.search)
  const q = qs.toString()
  return authorizedFetch(`/batches/mine${q ? `?${q}` : ''}`) as Promise<BatchRecord[]>
}

export function fetchStudentBatches() {
  return authorizedFetch('/batches/me') as Promise<BatchRecord[]>
}

export function fetchBatch(id: string) {
  return authorizedFetch(`/batches/${id}`) as Promise<BatchRecord>
}

export function createBatch(data: {
  name: string
  courseSlug: string
  batchCode?: string
  description?: string
  startDate: string
  endDate?: string
  schedule?: string
  maxCapacity?: number
  publish?: boolean
}) {
  return authorizedFetch('/batches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }) as Promise<BatchRecord>
}

export function updateBatch(id: string, data: Record<string, unknown>) {
  return authorizedFetch(`/batches/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }) as Promise<BatchRecord>
}

export function deleteBatch(id: string) {
  return authorizedFetch(`/batches/${id}`, { method: 'DELETE' })
}

export function archiveBatch(id: string) {
  return authorizedFetch(`/batches/${id}/archive`, { method: 'POST' })
}

export function publishBatch(id: string) {
  return authorizedFetch(`/batches/${id}/publish`, { method: 'POST' })
}

export function fetchBatchDashboard(id: string) {
  return authorizedFetch(`/batches/${id}/dashboard`)
}

export function fetchBatchCalendar(id: string) {
  return authorizedFetch(`/batches/${id}/calendar`)
}

export function previewBatchImport(
  file: File,
  options?: { defaultBatchId?: string; defaultCourseSlug?: string },
) {
  const form = new FormData()
  form.append('file', file)
  if (options?.defaultBatchId) form.append('defaultBatchId', options.defaultBatchId)
  if (options?.defaultCourseSlug) form.append('defaultCourseSlug', options.defaultCourseSlug)
  return authorizedMultipart<BatchImportPreviewResult>('/batches/import/preview', 'POST', form)
}

export function executeBatchImport(data: {
  jobId: string
  partialImport?: boolean
  rowNumbers?: number[]
}) {
  return authorizedFetch<BatchImportExecuteResult>('/batches/import/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export async function downloadBatchImportTemplate() {
  return authorizedDownload('/batches/import/template', 'batch-import-template.csv')
}
