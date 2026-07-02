import { downloadReport } from './analytics'

export { downloadReport }

export function downloadStudentProgressReport(format: 'csv' | 'pdf' | 'xlsx' = 'csv', courseSlug?: string) {
  return downloadReport('student-progress', format, courseSlug ? { courseSlug } : undefined)
}

export function downloadAssignmentReport(format: 'csv' | 'pdf' | 'xlsx' = 'csv', courseSlug?: string) {
  return downloadReport('assignments', format, courseSlug ? { courseSlug } : undefined)
}

export function downloadQuizReport(format: 'csv' | 'pdf' | 'xlsx' = 'csv', courseSlug?: string) {
  return downloadReport('quizzes', format, courseSlug ? { courseSlug } : undefined)
}

export function downloadBatchReport(format: 'csv' | 'pdf' | 'xlsx' = 'csv', batchId?: string) {
  return downloadReport('batches', format, batchId ? { batchId } : undefined)
}

export function downloadCourseReport(format: 'csv' | 'pdf' | 'xlsx' = 'csv', courseSlug?: string) {
  return downloadReport('courses', format, courseSlug ? { courseSlug } : undefined)
}

export function downloadCertificateReport(format: 'csv' | 'pdf' | 'xlsx' = 'csv', courseSlug?: string) {
  return downloadReport('certificates', format, courseSlug ? { courseSlug } : undefined)
}
