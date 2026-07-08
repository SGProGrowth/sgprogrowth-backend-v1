import { authorizedFetch } from './client'

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
  return authorizedFetch('/progress/me') as Promise<ProgressDashboard>
}

export function fetchCourseProgressDetail(courseSlug: string) {
  return authorizedFetch(`/progress/courses/${courseSlug}`) as Promise<CourseProgressDetail>
}

export function markLessonComplete(lessonId: string, courseSlug: string) {
  return authorizedFetch(`/progress/lessons/${lessonId}/courses/${courseSlug}/complete`, { method: 'POST' })
}

export function markLessonIncomplete(lessonId: string, courseSlug: string) {
  return authorizedFetch(`/progress/lessons/${lessonId}/courses/${courseSlug}/incomplete`, { method: 'POST' })
}

export function updateLessonProgress(
  lessonId: string,
  courseSlug: string,
  data: { videoProgressPct?: number; timeSpentSeconds?: number; resourceDownloaded?: boolean; recordAccess?: boolean },
) {
  return authorizedFetch(`/progress/lessons/${lessonId}/courses/${courseSlug}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export function fetchInstructorCourseProgressAnalytics(courseSlug: string) {
  return authorizedFetch(`/progress/instructor/courses/${courseSlug}/analytics`) as Promise<{
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
