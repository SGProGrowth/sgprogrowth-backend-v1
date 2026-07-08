import type {
  Announcement,
  BulkImportRow,
  CalendarEvent,
  GradeEntry,
  InstructorAssignment,
  InstructorBatch,
  InstructorCourse,
  InstructorMessage,
  InstructorNotification,
  InstructorQuiz,
  InstructorStudent,
  LiveSession,
  QuestionBankItem,
} from '../data/instructorData'

export interface InstructorProfile {
  id: string
  name: string
  email: string
  phone: string
  organization: string
  title: string
  designation: string
  bio: string
  avatarInitials: string
  avatarUrl?: string
  publicUrl: string
  expertise: string[]
  credentials: string[]
  skills: string[]
  experience: string
  avgRating: number
}

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
  unreadNotifications: number
}
