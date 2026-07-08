import { authorizedDownload, authorizedFetch, authorizedMultipart } from './client'
import type { PaginatedResponse } from './courses'
import type { Assignment } from '../../data/studentData'
import type { InstructorAssignment } from '../../data/instructorData'

export interface AssignmentDetail extends Assignment {
  instructions?: string
  moduleId?: string | null
  lessonId?: string | null
  allowResubmission: boolean
  allowedFileTypes: string[]
  maxFileSizeBytes: number
  visibility: string
  latePenaltyPct?: number | null
  allowLate: boolean
  attachments: Array<{
    id: string
    filename: string
    mimeType: string
    sizeBytes: number
    downloadUrl?: string
  }>
  submission?: SubmissionDetail | null
  submissionStatus?: string
}

export interface SubmissionDetail {
  id: string
  status: string
  body?: string | null
  score?: number | null
  feedback?: string | null
  attemptCount: number
  submittedAt?: string | null
  gradedAt?: string | null
  returnedAt?: string | null
  files: Array<{ id: string; filename: string; mimeType: string; sizeBytes: number; downloadUrl?: string }>
  historyFiles?: Array<{ id: string; filename: string; mimeType: string; sizeBytes: number; downloadUrl?: string }>
}

export interface InstructorSubmission extends SubmissionDetail {
  studentId: string
  studentName: string
  studentEmail: string
  enrollmentId: string
}

export interface CreateAssignmentInput {
  title: string
  courseSlug: string
  moduleId?: string
  lessonId?: string
  type?: string
  instructions?: string
  dueAt?: string
  maxScore?: number
  allowLate?: boolean
  latePenaltyPct?: number
  allowResubmission?: boolean
  allowedFileTypes?: string[]
  maxFileSizeBytes?: number
}

export function fetchInstructorAssignments(params?: {
  page?: number
  pageSize?: number
  q?: string
  course?: string
  status?: 'draft' | 'published'
}) {
  const qs = new URLSearchParams()
  if (params?.page) qs.set('page', String(params.page))
  if (params?.pageSize) qs.set('pageSize', String(params.pageSize))
  if (params?.q) qs.set('q', params.q)
  if (params?.course) qs.set('course', params.course)
  if (params?.status) qs.set('status', params.status)
  const query = qs.toString()
  return authorizedFetch(`/assignments/mine${query ? `?${query}` : ''}`) as Promise<
    PaginatedResponse<InstructorAssignment>
  >
}

export function fetchStudentAssignments(params?: {
  page?: number
  pageSize?: number
  q?: string
  course?: string
}) {
  const qs = new URLSearchParams()
  if (params?.page) qs.set('page', String(params.page))
  if (params?.pageSize) qs.set('pageSize', String(params.pageSize))
  if (params?.q) qs.set('q', params.q)
  if (params?.course) qs.set('course', params.course)
  const query = qs.toString()
  return authorizedFetch(`/assignments/me${query ? `?${query}` : ''}`) as Promise<
    PaginatedResponse<Assignment & { submissionStatus?: string; isOverdue?: boolean; dueSoon?: boolean }>
  >
}

export function fetchAssignment(id: string) {
  return authorizedFetch(`/assignments/${id}`) as Promise<AssignmentDetail>
}

export function createAssignment(input: CreateAssignmentInput) {
  return authorizedFetch('/assignments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }) as Promise<AssignmentDetail>
}

export function updateAssignment(id: string, input: Partial<CreateAssignmentInput>) {
  return authorizedFetch(`/assignments/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }) as Promise<AssignmentDetail>
}

export function deleteAssignment(id: string) {
  return authorizedFetch(`/assignments/${id}`, { method: 'DELETE' })
}

export function publishAssignment(id: string) {
  return authorizedFetch(`/assignments/${id}/publish`, { method: 'POST' })
}

export function unpublishAssignment(id: string) {
  return authorizedFetch(`/assignments/${id}/unpublish`, { method: 'POST' })
}

export function fetchSubmissions(assignmentId: string, params?: { q?: string; status?: string; page?: number }) {
  const qs = new URLSearchParams()
  if (params?.q) qs.set('q', params.q)
  if (params?.status) qs.set('status', params.status)
  if (params?.page) qs.set('page', String(params.page))
  const query = qs.toString()
  return authorizedFetch(`/assignments/${assignmentId}/submissions${query ? `?${query}` : ''}`) as Promise<
    PaginatedResponse<InstructorSubmission>
  >
}

export function gradeSubmission(
  assignmentId: string,
  submissionId: string,
  input: { score: number; feedback?: string; returnToStudent?: boolean },
) {
  return authorizedFetch(`/assignments/${assignmentId}/submissions/${submissionId}/grade`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function submitAssignment(
  assignmentId: string,
  input: { body?: string; files?: File[] },
  replace = false,
) {
  const form = new FormData()
  if (input.body) form.set('body', input.body)
  for (const file of input.files ?? []) {
    form.append('files', file)
  }
  return authorizedMultipart(
    `/assignments/${assignmentId}/submissions`,
    replace ? 'PUT' : 'POST',
    form,
  ) as Promise<SubmissionDetail>
}

export function mapApiAssignmentToStudent(row: Assignment & { submissionStatus?: string }): Assignment {
  const status =
    row.submissionStatus === 'graded' ? 'graded'
    : row.submissionStatus === 'submitted' ? 'submitted'
    : row.submissionStatus === 'overdue' ? 'overdue'
    : (row.status as Assignment['status']) ?? 'pending'

  return {
    id: row.id,
    title: row.title,
    courseId: row.courseId,
    courseTitle: row.courseTitle,
    dueDate: row.dueDate,
    dueLabel: row.dueLabel ?? row.dueDate,
    status: status as Assignment['status'],
    score: row.score,
    maxScore: row.maxScore,
    type: row.type,
  }
}

export async function downloadAuthenticatedFile(apiPath: string, filename: string) {
  return authorizedDownload(apiPath, filename)
}
