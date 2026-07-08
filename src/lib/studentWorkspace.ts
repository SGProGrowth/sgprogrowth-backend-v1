import type {
  Assignment,
  Certificate,
  EnrolledCourse,
  LearningMilestone,
  Notification,
  Quiz,
  StudentBatch,
  StudentCalendarEvent,
  StudentCoachingSession,
  StudentMessage,
  UpcomingActivity,
  WeeklyLearning,
} from '../data/studentData'

export interface StudentProfile {
  id: string
  name: string
  email: string
  phone: string
  organization: string
  title: string
  bio: string
  avatarInitials: string
  timezone: string
  memberSince: string
  preferences?: Record<string, unknown>
}

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
