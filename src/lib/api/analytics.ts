import { authorizedDownload, authorizedFetch } from './client'

export interface StudentAnalytics {
  overallProgress: number
  streak: number
  weeklyActivity: Array<{ day: string; hours: number; active: boolean }>
  monthlyActivityChart: Array<{ month: string; hours: number; sessions: number }>
  courseCompletion: Array<{ courseId: string; title: string; progressPct: number; hoursSpent: number }>
  assignmentPerformance: { submitted: number; graded: number; averageScore: number; trend: unknown[] }
  quizPerformance: { averageScore: number; passRate: number; trend: unknown[] }
  certificates: Array<{ id: string; credentialId: string; courseTitle: string; issuedAt: string }>
  continueLearning: unknown[]
  recentCourses: unknown[]
}

export interface InstructorAnalytics {
  totalStudents: number
  activeStudents: number
  studentsAtRisk: number
  studentsAtRiskList: Array<{ studentId: string; name: string; courseTitle: string; progressPct: number }>
  assignmentCompletionRate: number
  quizCompletionRate: number
  averageQuizScore: number
  averageAssignmentScore: number
  courseCompletionRate: number
  engagementRate: number
  certificatesIssued: number
  batchPerformance: Array<{ id: string; name: string; courseTitle: string; studentsCount: number; completionRate: number }>
  enrollmentTrend: Array<{ month: string; count: number }>
  completionTrend: Array<{ month: string; rate: number }>
}

export function fetchStudentAnalytics() {
  return authorizedFetch('/analytics/student/me') as Promise<StudentAnalytics>
}

export function fetchStudentAnalyticsWidgets() {
  return authorizedFetch('/analytics/student/widgets')
}

export function fetchStudentCourseTime(courseSlug: string) {
  return authorizedFetch(`/analytics/student/courses/${encodeURIComponent(courseSlug)}/time`)
}

export function fetchInstructorAnalytics(params?: {
  courseSlug?: string
  batchId?: string
  from?: string
  to?: string
}) {
  const qs = new URLSearchParams()
  if (params?.courseSlug) qs.set('courseSlug', params.courseSlug)
  if (params?.batchId) qs.set('batchId', params.batchId)
  if (params?.from) qs.set('from', params.from)
  if (params?.to) qs.set('to', params.to)
  const q = qs.toString()
  return authorizedFetch(`/analytics/instructor/me${q ? `?${q}` : ''}`) as Promise<InstructorAnalytics>
}

export function fetchInstructorAnalyticsWidgets() {
  return authorizedFetch('/analytics/instructor/widgets')
}

export function fetchInstructorHeatmap(courseSlug?: string) {
  const q = courseSlug ? `?courseSlug=${encodeURIComponent(courseSlug)}` : ''
  return authorizedFetch(`/analytics/instructor/heatmap${q}`)
}

export async function downloadReport(
  type: 'student-progress' | 'assignments' | 'quizzes' | 'batches' | 'courses' | 'certificates',
  format: 'csv' | 'pdf' | 'xlsx' = 'csv',
  params?: { courseSlug?: string; batchId?: string; from?: string; to?: string },
) {
  const qs = new URLSearchParams({ format })
  if (params?.courseSlug) qs.set('courseSlug', params.courseSlug)
  if (params?.batchId) qs.set('batchId', params.batchId)
  if (params?.from) qs.set('from', params.from)
  if (params?.to) qs.set('to', params.to)
  return authorizedDownload(
    `/reports/${type}?${qs}`,
    `${type}-${new Date().toISOString().slice(0, 10)}.${format === 'xlsx' ? 'xlsx' : format}`,
  )
}

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
