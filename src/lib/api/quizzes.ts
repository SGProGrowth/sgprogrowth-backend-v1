import { getApiBaseUrl } from './client'
import { getAccessToken } from './tokenStorage'
import type { PaginatedResponse } from './courses'
import type { InstructorQuiz } from '../../data/instructorData'
import type { Quiz } from '../../data/studentData'

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

export interface QuizDetail extends InstructorQuiz {
  description?: string | null
  instructions?: string | null
  durationMinutes?: number
  unlimitedDuration?: boolean
  maxAttempts?: number
  randomizeQuestions?: boolean
  randomizeOptions?: boolean
  negativeMarking?: boolean
  showScoreImmediately?: boolean
  showCorrectAnswers?: boolean
  showExplanations?: boolean
  quizQuestions?: Array<{
    id: string
    questionId: string
    questionText: string
    type: string
    points: number
  }>
}

export interface CreateQuizInput {
  title: string
  description?: string
  instructions?: string
  courseSlug?: string
  isGeneric?: boolean
  durationMinutes?: number
  unlimitedDuration?: boolean
  maxAttempts?: number
  passScore?: number
  randomizeQuestions?: boolean
  randomizeOptions?: boolean
  negativeMarking?: boolean
  showScoreImmediately?: boolean
  showCorrectAnswers?: boolean
  showExplanations?: boolean
}

export interface QuizPlayerState {
  attemptId: string
  quizId: string
  attemptNumber: number
  title: string
  instructions?: string | null
  durationMinutes: number
  unlimitedDuration: boolean
  expiresAt: string | null
  startedAt: string
  questions: Array<{
    quizQuestionId: string
    questionId: string
    questionText: string
    type: string
    points: number
    options: Array<{ id: string; label?: string | null; text: string }>
    savedResponse?: unknown
    flagged?: boolean
  }>
}

export interface QuizResultDetail {
  attemptId: string
  quizId: string
  attemptNumber: number
  score: number | null
  maxScore: number
  percentage: number | null
  passed: boolean | null
  status: string
  timeTakenSeconds?: number | null
  showScore: boolean
  showCorrectAnswers: boolean
  showExplanations: boolean
  answers?: Array<{
    quizQuestionId: string
    questionText: string
    type: string
    response: unknown
    score: number | null
    maxScore: number
    isCorrect?: boolean | null
    explanation?: string | null
    gradingStatus: string
  }>
}

export function fetchInstructorQuizzes(params?: {
  page?: number
  pageSize?: number
  q?: string
  status?: string
  course?: string
  generic?: boolean
}) {
  const qs = new URLSearchParams()
  if (params?.page) qs.set('page', String(params.page))
  if (params?.pageSize) qs.set('pageSize', String(params.pageSize))
  if (params?.q) qs.set('q', params.q)
  if (params?.status) qs.set('status', params.status)
  if (params?.course) qs.set('course', params.course)
  if (params?.generic !== undefined) qs.set('generic', String(params.generic))
  const query = qs.toString()
  return authFetch(`/quizzes/mine${query ? `?${query}` : ''}`) as Promise<PaginatedResponse<InstructorQuiz>>
}

export function fetchStudentQuizzes() {
  return authFetch('/quizzes/me') as Promise<
    Array<
      Quiz & {
        inProgressAttemptId?: string
        latestAttemptId?: string
        status: 'upcoming' | 'completed' | 'in_progress'
      }
    >
  >
}

export function fetchStudentQuizAnalytics() {
  return authFetch('/quizzes/me/analytics') as Promise<{
    averageScore: number
    quizzesTaken: number
    passRate: number
    strongestArea: string
    needsImprovement: string
    trend: string
  }>
}

export function createQuiz(input: CreateQuizInput) {
  return authFetch('/quizzes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }) as Promise<QuizDetail>
}

export function updateQuiz(id: string, input: Partial<CreateQuizInput>) {
  return authFetch(`/quizzes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }) as Promise<QuizDetail>
}

export function deleteQuiz(id: string) {
  return authFetch(`/quizzes/${id}`, { method: 'DELETE' })
}

export function publishQuiz(id: string) {
  return authFetch(`/quizzes/${id}/publish`, { method: 'POST' }) as Promise<QuizDetail>
}

export function unpublishQuiz(id: string) {
  return authFetch(`/quizzes/${id}/unpublish`, { method: 'POST' }) as Promise<QuizDetail>
}

export function archiveQuiz(id: string) {
  return authFetch(`/quizzes/${id}/archive`, { method: 'POST' }) as Promise<QuizDetail>
}

export function getQuiz(id: string) {
  return authFetch(`/quizzes/${id}`) as Promise<QuizDetail>
}

export function setQuizQuestions(
  quizId: string,
  questions: Array<{ questionId: string; sortOrder?: number; pinnedVersion?: number; pointsOverride?: number }>,
) {
  return authFetch(`/quizzes/${quizId}/questions`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ questions }),
  }) as Promise<QuizDetail>
}

export function generateQuizQuestions(
  quizId: string,
  input: { mode: string; count: number; category?: string; tag?: string; difficulty?: string; replaceExisting?: boolean },
) {
  return authFetch(`/quizzes/${quizId}/questions/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }) as Promise<QuizDetail>
}

export function fetchQuizAnalytics(quizId: string) {
  return authFetch(`/quizzes/${quizId}/analytics`) as Promise<{
    attemptCount: number
    averageScore: number
    highestScore: number
    lowestScore: number
    passRate: number
    attemptDistribution: Array<{ range: string; count: number }>
    difficultQuestions: Array<{ questionId: string; incorrectCount: number }>
  }>
}

export function startQuizAttempt(quizId: string) {
  return authFetch(`/quizzes/${quizId}/attempts/start`, { method: 'POST' }) as Promise<QuizPlayerState>
}

export function fetchQuizPlayer(attemptId: string) {
  return authFetch(`/quizzes/attempts/${attemptId}/player`) as Promise<QuizPlayerState>
}

export function saveQuizAnswers(
  attemptId: string,
  answers: Array<{ quizQuestionId: string; response: unknown; flagged?: boolean }>,
) {
  return authFetch(`/quizzes/attempts/${attemptId}/answers`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers }),
  })
}

export function submitQuizAttempt(attemptId: string) {
  return authFetch(`/quizzes/attempts/${attemptId}/submit`, { method: 'POST' }) as Promise<QuizResultDetail>
}

export function fetchQuizResult(attemptId: string) {
  return authFetch(`/quizzes/attempts/${attemptId}/result`) as Promise<QuizResultDetail>
}

export function fetchQuizAttemptHistory(quizId: string) {
  return authFetch(`/quizzes/${quizId}/attempts/history`) as Promise<
    Array<{
      id: string
      attemptNumber: number
      score: number | null
      percentage: number | null
      passed: boolean | null
      status: string
      submittedAt: string | null
    }>
  >
}

export function mapApiQuizToInstructor(row: InstructorQuiz & { courseId?: string | null }): InstructorQuiz {
  return {
    id: row.id,
    instructorId: row.instructorId,
    title: row.title,
    courseId: row.courseId ?? null,
    courseTitle: row.courseTitle,
    questions: row.questions,
    duration: row.duration,
    attempts: row.attempts,
    status: row.status === 'archived' ? 'archived' : row.status,
    isGeneric: row.isGeneric,
    passScore: row.passScore,
    lastUpdated: row.lastUpdated,
  }
}

export function mapApiQuizToStudent(row: Quiz & { status?: string }): Quiz {
  return {
    id: row.id,
    title: row.title,
    courseId: row.courseId,
    courseTitle: row.courseTitle,
    date: row.date,
    dateLabel: row.dateLabel,
    status: row.status === 'completed' ? 'completed' : 'upcoming',
    score: row.score,
    maxScore: row.maxScore,
    attempts: row.attempts,
    maxAttempts: row.maxAttempts,
    duration: row.duration,
  }
}
