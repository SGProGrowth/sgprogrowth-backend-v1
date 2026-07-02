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
  return authFetch('/analytics/student/me') as Promise<StudentAnalytics>
}

export function fetchStudentAnalyticsWidgets() {
  return authFetch('/analytics/student/widgets')
}

export function fetchStudentCourseTime(courseSlug: string) {
  return authFetch(`/analytics/student/courses/${encodeURIComponent(courseSlug)}/time`)
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
  return authFetch(`/analytics/instructor/me${q ? `?${q}` : ''}`) as Promise<InstructorAnalytics>
}

export function fetchInstructorAnalyticsWidgets() {
  return authFetch('/analytics/instructor/widgets')
}

export function fetchInstructorHeatmap(courseSlug?: string) {
  const q = courseSlug ? `?courseSlug=${encodeURIComponent(courseSlug)}` : ''
  return authFetch(`/analytics/instructor/heatmap${q}`)
}

export async function downloadReport(
  type: 'student-progress' | 'assignments' | 'quizzes' | 'batches' | 'courses' | 'certificates',
  format: 'csv' | 'pdf' | 'xlsx' = 'csv',
  params?: { courseSlug?: string; batchId?: string; from?: string; to?: string },
) {
  const token = getAccessToken()
  const qs = new URLSearchParams({ format })
  if (params?.courseSlug) qs.set('courseSlug', params.courseSlug)
  if (params?.batchId) qs.set('batchId', params.batchId)
  if (params?.from) qs.set('from', params.from)
  if (params?.to) qs.set('to', params.to)
  const res = await fetch(`${getApiBaseUrl()}/reports/${type}?${qs}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new Error('Failed to download report')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${type}-${new Date().toISOString().slice(0, 10)}.${format === 'xlsx' ? 'xlsx' : format}`
  a.click()
  URL.revokeObjectURL(url)
}
