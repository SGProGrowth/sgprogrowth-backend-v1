import {
  type EnrolledCourse,
  type Assignment,
  type Quiz,
  type Certificate,
  type Notification,
  type LearningMilestone,
  type UpcomingActivity,
  type WeeklyLearning,
  type StudentCalendarEvent,
  type StudentBatch,
  type StudentCoachingSession,
  type StudentMessage,
  enrolledCourses,
  assignments as allAssignments,
  quizzes as allQuizzes,
  earnedCertificates,
  notifications as allNotifications,
  learningMilestones,
  upcomingActivities,
  studentCalendarEvents,
  studentBatches,
  studentCoachingSessions,
  studentMessages,
  weeklyLearning,
} from '../data/studentData'
import { type StudentProfile, resolveStudentProfile } from '../data/studentProfiles'
import { courseIdsForStudent } from '../data/studentCourseAccess'
import {
  getCachedWorkspace,
  setCachedWorkspace,
  workspaceCacheKey,
} from './workspaceCache'

export interface StudentSummary {
  totalHours: number
  weeklyHours: number
  weeklyGoal: number
  activeCourses: number
  completedCourses: number
  streak: number
  longestStreak: number
  overallProgress: number
  certificationsInProgress: number
  coachingSessionsThisMonth: number
}

export interface StudentWorkspace {
  profile: StudentProfile
  courses: EnrolledCourse[]
  assignments: Assignment[]
  quizzes: Quiz[]
  certificates: Certificate[]
  notifications: Notification[]
  milestones: LearningMilestone[]
  upcomingActivities: UpcomingActivity[]
  calendarEvents: StudentCalendarEvent[]
  batches: StudentBatch[]
  coachingSessions: StudentCoachingSession[]
  messages: StudentMessage[]
  weeklyLearning: WeeklyLearning[]
  summary: StudentSummary
  continueLearning: EnrolledCourse | undefined
  unreadNotifications: number
  unreadMessages: number
  pendingAssignments: number
  upcomingCoachingCount: number
}

function computeSummary(
  courses: EnrolledCourse[],
  coachingSessions: StudentCoachingSession[],
): StudentSummary {
  const active = courses.filter((c) => c.status === 'active')
  const completed = courses.filter((c) => c.status === 'completed')
  const overallProgress =
    active.length > 0
      ? Math.round(active.reduce((s, c) => s + c.progress, 0) / active.length)
      : completed.length > 0
        ? 100
        : 0

  return {
    totalHours: courses.reduce((s, c) => s + c.hoursSpent, 0),
    weeklyHours: active.length > 0 ? 8 : 0,
    weeklyGoal: 10,
    activeCourses: active.length,
    completedCourses: completed.length,
    streak: active.length > 1 ? 12 : active.length > 0 ? 5 : 0,
    longestStreak: active.length > 1 ? 18 : active.length > 0 ? 8 : 0,
    overallProgress,
    certificationsInProgress: active.filter(
      (c) => c.category.includes('Cloud') || c.category.includes('Data'),
    ).length,
    coachingSessionsThisMonth: coachingSessions.filter((s) => s.status === 'upcoming').length,
  }
}

function matchesCourseScope(
  courseTitle: string | undefined,
  courseIds: Set<string>,
  courses: EnrolledCourse[],
): boolean {
  if (!courseTitle) return true
  return courses.some(
    (c) => courseIds.has(c.id) && (courseTitle.includes(c.title.split(' ')[0] ?? '') || c.title.includes(courseTitle.split(' ')[0] ?? '')),
  )
}

function buildStudentWorkspace(
  userId: string,
  email: string,
  name: string,
  avatarInitials: string,
): StudentWorkspace {
  const profile = resolveStudentProfile(userId, email, name, avatarInitials)
  const courseIds = courseIdsForStudent(profile.id)
  const courses = enrolledCourses.filter((c) => courseIds.has(c.id))

  const assignmentList = allAssignments.filter((a) => courseIds.has(a.courseId))
  const quizList = allQuizzes.filter((q) => courseIds.has(q.courseId))
  const certificateList = earnedCertificates.filter((c) => courseIds.has(c.courseId))
  const milestoneList = learningMilestones.filter((m) => !m.courseId || courseIds.has(m.courseId))
  const activityList = upcomingActivities.filter((a) => !a.courseId || courseIds.has(a.courseId))
  const calendarList = studentCalendarEvents.filter((e) =>
    !e.courseTitle || courses.some((c) => e.courseTitle?.includes(c.title.split(' ')[0] ?? '')),
  )
  const batchList = studentBatches.filter((b) => courseIds.has(b.courseId))
  const sessionList = studentCoachingSessions.filter((s) =>
    matchesCourseScope(s.courseTitle, courseIds, courses),
  )
  const messageList = studentMessages.filter((m) =>
    matchesCourseScope(m.courseTitle, courseIds, courses),
  )
  const notificationList = allNotifications.filter(
    (n) => !n.studentId || n.studentId === profile.id,
  )

  const continueLearning = courses
    .filter((c) => c.status === 'active')
    .sort((a, b) => b.progress - a.progress)[0]

  const summary = computeSummary(courses, sessionList)

  return {
    profile,
    courses,
    assignments: assignmentList,
    quizzes: quizList,
    certificates: certificateList,
    notifications: notificationList,
    milestones: milestoneList,
    upcomingActivities: activityList,
    calendarEvents: calendarList,
    batches: batchList,
    coachingSessions: sessionList,
    messages: messageList,
    weeklyLearning: courses.length > 0 ? weeklyLearning : [],
    summary,
    continueLearning,
    unreadNotifications: notificationList.filter((n) => !n.read).length,
    unreadMessages: messageList.filter((m) => !m.read).length,
    pendingAssignments: assignmentList.filter((a) => a.status === 'pending' || a.status === 'overdue').length,
    upcomingCoachingCount: sessionList.filter((s) => s.status === 'upcoming').length,
  }
}

/** Scoped workspace for the signed-in student — replace with GET /students/me */
export function getStudentWorkspace(
  userId: string,
  email: string,
  name: string,
  avatarInitials: string,
): StudentWorkspace {
  const key = workspaceCacheKey('student', userId)
  const cached = getCachedWorkspace<StudentWorkspace>(key)
  if (cached) return cached
  return setCachedWorkspace(key, buildStudentWorkspace(userId, email, name, avatarInitials))
}
