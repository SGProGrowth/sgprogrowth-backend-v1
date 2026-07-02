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

export interface CourseProgressDetail {
  courseId: string
  courseTitle: string
  progressPct: number
  modulesCompleted: number
  hoursSpent: number
  modules: Array<{
    id: string
    title: string
    progressPct: number
    completedLessons: number
    totalLessons: number
    lessons: Array<{
      id: string
      title: string
      type: string
      status: string
      videoProgressPct?: number
    }>
  }>
}

export interface ProgressDashboard {
  overallProgress: number
  streak: number
  longestStreak: number
  weeklyActivity: Array<{ day: string; hours: number; active: boolean }>
  totalHours: number
  weeklyHours: number
  continueLearning: Array<{
    courseId: string
    courseTitle: string
    lessonId: string | null
    lessonTitle: string
    progressPct: number
  }>
  pendingAssignments: number
  pendingQuizzes: number
}

export function fetchProgressDashboard() {
  return authFetch('/progress/me') as Promise<ProgressDashboard>
}

export function fetchCourseProgressDetail(courseSlug: string) {
  return authFetch(`/progress/courses/${courseSlug}`) as Promise<CourseProgressDetail>
}

export function markLessonComplete(lessonId: string, courseSlug: string) {
  return authFetch(`/progress/lessons/${lessonId}/courses/${courseSlug}/complete`, { method: 'POST' })
}

export function markLessonIncomplete(lessonId: string, courseSlug: string) {
  return authFetch(`/progress/lessons/${lessonId}/courses/${courseSlug}/incomplete`, { method: 'POST' })
}

export function updateLessonProgress(
  lessonId: string,
  courseSlug: string,
  data: { videoProgressPct?: number; timeSpentSeconds?: number; resourceDownloaded?: boolean; recordAccess?: boolean },
) {
  return authFetch(`/progress/lessons/${lessonId}/courses/${courseSlug}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export function fetchInstructorCourseProgressAnalytics(courseSlug: string) {
  return authFetch(`/progress/instructor/courses/${courseSlug}/analytics`) as Promise<{
    courseId: string
    title: string
    totalStudents: number
    averageProgress: number
    completionRate: number
    activeLearners: number
    studentsFallingBehind: Array<{ studentId: string; name: string; progressPct: number; lastAccessedAt: string | null }>
    mostRevisitedLessons: Array<{ lessonId: string; visitCount: number }>
  }>
}
