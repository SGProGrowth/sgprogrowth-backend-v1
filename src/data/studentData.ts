/* ── Types ── */

export type CourseStatus = 'active' | 'completed' | 'recommended'
export type AssignmentStatus = 'pending' | 'submitted' | 'graded' | 'overdue'
export type QuizStatus = 'upcoming' | 'completed'
export type NotificationType = 'course' | 'announcement' | 'deadline' | 'coaching' | 'achievement'
export type MilestoneStatus = 'completed' | 'in-progress' | 'upcoming'

export interface EnrolledCourse {
  id: string
  title: string
  instructor: string
  coach: string
  category: string
  level: string
  duration: string
  progress: number
  modulesCompleted: number
  totalModules: number
  lastAccessed: string
  nextLesson: string
  status: 'active' | 'completed'
  thumbnail: string
  rating: number
  hoursSpent: number
}

export interface Assignment {
  id: string
  title: string
  courseId: string
  courseTitle: string
  dueDate: string
  dueLabel: string
  status: AssignmentStatus
  score?: number
  maxScore?: number
  type: 'project' | 'essay' | 'lab' | 'reflection'
}

export interface Quiz {
  id: string
  title: string
  courseId: string
  courseTitle: string
  date: string
  dateLabel: string
  status: QuizStatus
  score?: number
  maxScore: number
  attempts: number
  maxAttempts: number
  duration: string
}

export interface Certificate {
  id: string
  title: string
  courseId: string
  issuedDate: string
  credentialId: string
  instructor: string
  skills: string[]
}

export interface Notification {
  id: string
  studentId?: string
  type: NotificationType
  title: string
  message: string
  time: string
  read: boolean
  actionLabel?: string
  actionHref?: string
}

export interface LearningMilestone {
  id: string
  phase: string
  title: string
  description: string
  status: MilestoneStatus
  date: string
  courseId?: string
}

export interface UpcomingActivity {
  id: string
  title: string
  subtitle: string
  datetime: string
  type: 'coaching' | 'live' | 'module' | 'assignment' | 'quiz' | 'deadline'
  courseId?: string
}

export interface WeeklyLearning {
  day: string
  hours: number
  active: boolean
}

export type CalendarEventType = 'coaching' | 'live' | 'deadline' | 'quiz' | 'module' | 'batch'

export interface StudentCalendarEvent {
  id: string
  title: string
  date: string
  time: string
  type: CalendarEventType
  courseTitle?: string
  location?: string
}

export type BatchStatus = 'active' | 'upcoming' | 'completed'

export interface StudentBatch {
  id: string
  name: string
  courseId: string
  courseTitle: string
  instructor: string
  coach: string
  startDate: string
  endDate: string
  status: BatchStatus
  schedule: string
  studentsCount: number
  progress: number
  nextSession: string
  batchmates: { name: string; initials: string }[]
}

export interface StudentCoachingSession {
  id: string
  title: string
  coach: string
  courseTitle?: string
  date: string
  time: string
  duration: string
  type: '1:1' | 'group' | 'office-hours'
  status: 'upcoming' | 'completed' | 'cancelled'
  meetingLink: string
  notes?: string
}

export interface StudentMessage {
  id: string
  from: string
  role: string
  subject: string
  preview: string
  body: string
  time: string
  read: boolean
  courseTitle?: string
}

/* ── Page meta for layout header ── */

export const studentPageMeta: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Overview', subtitle: 'Your learning at a glance' },
  '/dashboard/courses': { title: 'My Courses', subtitle: 'Active enrollments and recommendations' },
  '/dashboard/progress': { title: 'Learning Progress', subtitle: 'Track milestones and completion' },
  '/dashboard/assignments': { title: 'Assignments', subtitle: 'Submissions and deadlines' },
  '/dashboard/quizzes': { title: 'Quizzes & Assessments', subtitle: 'Tests and performance' },
  '/dashboard/certificates': { title: 'Certificates', subtitle: 'Earned credentials and achievements' },
  '/dashboard/notifications': { title: 'Notifications', subtitle: 'Updates, announcements, and alerts' },
  '/dashboard/settings': { title: 'Profile & Settings', subtitle: 'Account and learning preferences' },
  '/dashboard/calendar': { title: 'Calendar', subtitle: 'Sessions, deadlines, and learning events' },
  '/dashboard/batches': { title: 'My Batches', subtitle: 'Cohort schedules and batchmates' },
  '/dashboard/coaching': { title: 'Live Sessions', subtitle: 'Coaching and live class schedule' },
  '/dashboard/messages': { title: 'Messages', subtitle: 'Conversations with instructors' },
  '/dashboard/downloads': { title: 'Downloads', subtitle: 'Course materials and resources' },
}

export const defaultLearningPreferences = {
  weeklyGoalHours: 10,
  emailNotifications: true,
  deadlineReminders: true,
  coachingReminders: true,
  courseUpdates: true,
  timezone: 'Asia/Kolkata',
  learningPace: 'moderate' as const,
  preferredCategories: [] as string[],
}
