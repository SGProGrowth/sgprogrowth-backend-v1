import { getApiBaseUrl } from './client'
import { getAccessToken } from './tokenStorage'

async function authFetch(path: string, init: RequestInit = {}) {
  const token = getAccessToken()
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const res = await fetch(`${getApiBaseUrl()}${path}`, { ...init, headers })
  const payload = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = (payload as { message?: string | string[] }).message ?? `Request failed (${res.status})`
    throw new Error(Array.isArray(message) ? message.join(', ') : String(message))
  }
  return payload
}

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
  return authFetch(`/batches/mine${q ? `?${q}` : ''}`) as Promise<BatchRecord[]>
}

export function fetchStudentBatches() {
  return authFetch('/batches/me') as Promise<BatchRecord[]>
}

export function fetchBatch(id: string) {
  return authFetch(`/batches/${id}`) as Promise<BatchRecord>
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
  return authFetch('/batches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }) as Promise<BatchRecord>
}

export function updateBatch(id: string, data: Record<string, unknown>) {
  return authFetch(`/batches/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }) as Promise<BatchRecord>
}

export function deleteBatch(id: string) {
  return authFetch(`/batches/${id}`, { method: 'DELETE' })
}

export function archiveBatch(id: string) {
  return authFetch(`/batches/${id}/archive`, { method: 'POST' })
}

export function publishBatch(id: string) {
  return authFetch(`/batches/${id}/publish`, { method: 'POST' })
}

export function fetchBatchDashboard(id: string) {
  return authFetch(`/batches/${id}/dashboard`)
}

export function fetchBatchCalendar(id: string) {
  return authFetch(`/batches/${id}/calendar`)
}

export function previewBatchImport(
  file: File,
  options?: { defaultBatchId?: string; defaultCourseSlug?: string },
) {
  const token = getAccessToken()
  const form = new FormData()
  form.append('file', file)
  if (options?.defaultBatchId) form.append('defaultBatchId', options.defaultBatchId)
  if (options?.defaultCourseSlug) form.append('defaultCourseSlug', options.defaultCourseSlug)
  return fetch(`${getApiBaseUrl()}/batches/import/preview`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  }).then(async (res) => {
    const payload = await res.json().catch(() => ({}))
    if (!res.ok) {
      const message = (payload as { message?: string | string[] }).message ?? `Request failed (${res.status})`
      throw new Error(Array.isArray(message) ? message.join(', ') : String(message))
    }
    return payload as BatchImportPreviewResult
  })
}

export function executeBatchImport(data: {
  jobId: string
  partialImport?: boolean
  rowNumbers?: number[]
}) {
  return authFetch('/batches/import/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }) as Promise<BatchImportExecuteResult>
}

export async function downloadBatchImportTemplate() {
  const token = getAccessToken()
  const res = await fetch(`${getApiBaseUrl()}/batches/import/template`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new Error('Failed to download template')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'batch-import-template.csv'
  a.click()
  URL.revokeObjectURL(url)
}
