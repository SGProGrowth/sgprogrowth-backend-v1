import {
  type InstructorAssignment,
  type InstructorBatch,
  type InstructorCourse,
  type InstructorNotification,
  type InstructorQuiz,
  type InstructorStudent,
  type InstructorMessage,
  type Announcement,
  type CalendarEvent,
  type GradeEntry,
  type LiveSession,
  type QuestionBankItem,
  type BulkImportRow,
  allInstructorCourses,
  allInstructorStudents,
  allGradeEntries,
  allLiveSessions,
  allAnnouncements,
  allInstructorMessages,
  allInstructorNotifications,
  allCalendarEvents,
  allInstructorQuizzes,
  allInstructorAssignments,
  allQuestionBankItems,
  allInstructorBatches,
  allBulkImportPreviewRows,
  allAnalyticsByInstructor,
} from '../data/instructorData'
import {
  type InstructorProfile,
  resolveInstructorProfile,
} from '../data/instructorProfiles'
import {
  getCachedWorkspace,
  setCachedWorkspace,
  workspaceCacheKey,
} from './workspaceCache'

export interface InstructorSummary {
  totalStudents: number
  activeCourses: number
  avgCompletion: number
  sessionsThisWeek: number
  pendingGrades: number
  monthlyRevenue: string
  newEnrollments: number
  coursesCreated: number
  coursesPublished: number
  studentsEnrolled: number
}

export interface InstructorWorkspace {
  profile: InstructorProfile
  courses: InstructorCourse[]
  students: InstructorStudent[]
  grades: GradeEntry[]
  liveSessions: LiveSession[]
  announcements: Announcement[]
  messages: InstructorMessage[]
  notifications: InstructorNotification[]
  calendarEvents: CalendarEvent[]
  quizzes: InstructorQuiz[]
  assignments: InstructorAssignment[]
  questionBank: QuestionBankItem[]
  batches: InstructorBatch[]
  bulkImportPreview: BulkImportRow[]
  summary: InstructorSummary
  analytics: (typeof allAnalyticsByInstructor)[string]
  unreadNotifications: number
}

const emptyAnalytics = allAnalyticsByInstructor.default

function courseIdsFor(instructorId: string): Set<string> {
  return new Set(allInstructorCourses.filter((c) => c.instructorId === instructorId).map((c) => c.id))
}

function computeSummary(
  courses: InstructorCourse[],
  students: InstructorStudent[],
  grades: GradeEntry[],
  sessions: LiveSession[],
): InstructorSummary {
  const published = courses.filter((c) => c.status === 'published')
  const totalStudents = students.length
  const avgCompletion =
    published.length > 0
      ? Math.round(published.reduce((s, c) => s + c.completion, 0) / published.length)
      : 0
  const pendingGrades = grades.filter((g) => g.status === 'pending').length
  const sessionsThisWeek = sessions.filter((s) => s.status === 'scheduled').length
  const revenueTotal = published.reduce((s, c) => {
    const num = parseInt(c.revenue.replace(/[^\d]/g, ''), 10)
    return s + (Number.isNaN(num) ? 0 : num)
  }, 0)

  return {
    totalStudents,
    activeCourses: published.length,
    avgCompletion,
    sessionsThisWeek,
    pendingGrades,
    monthlyRevenue: revenueTotal > 0 ? `₹${revenueTotal.toLocaleString('en-IN')}` : '—',
    newEnrollments: totalStudents > 0 ? Math.max(1, Math.floor(totalStudents * 0.08)) : 0,
    coursesCreated: courses.length,
    coursesPublished: published.length,
    studentsEnrolled: totalStudents,
  }
}

function buildInstructorWorkspace(
  userId: string,
  email: string,
  name: string,
  avatarInitials: string,
): InstructorWorkspace {
  const profile = resolveInstructorProfile(userId, email, name, avatarInitials)
  const instructorId = profile.id
  const courseIds = courseIdsFor(instructorId)

  const courses = allInstructorCourses.filter((c) => c.instructorId === instructorId)
  const students = allInstructorStudents.filter((s) => courseIds.has(s.courseId))
  const grades = allGradeEntries.filter((g) => g.instructorId === instructorId)
  const liveSessions = allLiveSessions.filter((s) => s.instructorId === instructorId)
  const announcements = allAnnouncements.filter((a) => a.instructorId === instructorId)
  const messages = allInstructorMessages.filter((m) => m.instructorId === instructorId)
  const notifications = allInstructorNotifications.filter((n) => n.instructorId === instructorId)
  const calendarEvents = allCalendarEvents.filter((e) => e.instructorId === instructorId)
  const quizzes = allInstructorQuizzes.filter((q) => q.instructorId === instructorId)
  const assignments = allInstructorAssignments.filter((a) => a.instructorId === instructorId)
  const questionBank = allQuestionBankItems.filter((q) => q.instructorId === instructorId)
  const batches = allInstructorBatches.filter((b) => b.instructorId === instructorId)
  const bulkImportPreview = allBulkImportPreviewRows.filter((r) => r.instructorId === instructorId)

  const summary = computeSummary(courses, students, grades, liveSessions)
  const analytics = allAnalyticsByInstructor[instructorId] ?? emptyAnalytics

  return {
    profile,
    courses,
    students,
    grades,
    liveSessions,
    announcements,
    messages,
    notifications,
    calendarEvents,
    quizzes,
    assignments,
    questionBank,
    batches,
    bulkImportPreview,
    summary,
    analytics,
    unreadNotifications: notifications.filter((n) => !n.read).length,
  }
}

/** Scoped workspace for the signed-in instructor — replace with GET /instructors/me */
export function getInstructorWorkspace(
  userId: string,
  email: string,
  name: string,
  avatarInitials: string,
): InstructorWorkspace {
  const key = workspaceCacheKey('instructor', userId)
  const cached = getCachedWorkspace<InstructorWorkspace>(key)
  if (cached) return cached
  return setCachedWorkspace(key, buildInstructorWorkspace(userId, email, name, avatarInitials))
}

export function getCourseByIdForInstructor(
  courseId: string,
  userId: string,
  email: string,
  name: string,
  avatarInitials: string,
): InstructorCourse | undefined {
  const workspace = getInstructorWorkspace(userId, email, name, avatarInitials)
  return workspace.courses.find((c) => c.id === courseId)
}
