export type CourseStatus = 'draft' | 'published' | 'archived'
export type LessonType = 'video' | 'pdf' | 'resource' | 'live' | 'quiz' | 'assignment'
export type PublishVisibility = 'public' | 'private' | 'invite'

export interface InstructorCourse {
  id: string
  instructorId: string
  title: string
  subtitle: string
  description: string
  categoryId: string
  category: string
  level: string
  duration: string
  status: CourseStatus
  students: number
  completion: number
  rating: number
  reviewCount: number
  revenue: string
  price: string
  thumbnail: string
  banner: string
  learningOutcomes: string[]
  requirements: string[]
  visibility: PublishVisibility
  coachingIncluded: boolean
  updatedAt: string
  modules: CourseModule[]
}

export interface CourseModule {
  id: string
  title: string
  order: number
  lessons: CourseLesson[]
}

export interface CourseLesson {
  id: string
  title: string
  type: LessonType
  duration: string
  order: number
}

export interface InstructorStudent {
  id: string
  name: string
  email: string
  avatarInitials: string
  courseId: string
  courseTitle: string
  enrolledDate: string
  progress: number
  lastActive: string
  status: 'active' | 'at-risk' | 'completed'
}

export interface GradeEntry {
  id: string
  instructorId: string
  studentName: string
  courseTitle: string
  assignmentTitle: string
  submittedDate: string
  score: number | null
  maxScore: number
  status: 'pending' | 'graded' | 'late'
}

export interface LiveSession {
  id: string
  instructorId: string
  title: string
  courseTitle: string
  studentName?: string
  date: string
  time: string
  duration: string
  type: '1:1' | 'group' | 'office-hours'
  status: 'scheduled' | 'completed' | 'cancelled'
  meetingLink: string
}

export interface Announcement {
  id: string
  instructorId: string
  title: string
  courseTitle: string
  message: string
  date: string
  audience: 'all' | 'course' | 'at-risk'
  status: 'sent' | 'scheduled' | 'draft'
}

export interface InstructorMessage {
  id: string
  instructorId: string
  from: string
  subject: string
  preview: string
  time: string
  read: boolean
  courseTitle?: string
}

export interface InstructorNotification {
  id: string
  instructorId: string
  title: string
  message: string
  time: string
  read: boolean
  type: 'enrollment' | 'submission' | 'review' | 'session' | 'system'
}

export interface CalendarEvent {
  id: string
  instructorId: string
  title: string
  date: string
  time: string
  type: 'session' | 'deadline' | 'live' | 'review'
  courseTitle?: string
}

export interface InstructorQuiz {
  id: string
  instructorId: string
  title: string
  courseId: string | null
  courseTitle: string
  questions: number
  duration: string
  attempts: number
  status: 'draft' | 'published' | 'archived'
  isGeneric: boolean
  passScore?: number
  lastUpdated?: string
}

export interface InstructorAssignment {
  id: string
  instructorId: string
  title: string
  courseId: string
  courseTitle: string
  dueDate: string
  type: 'project' | 'essay' | 'lab' | 'reflection'
  submissions: number
  totalStudents: number
  status: 'draft' | 'published'
  maxScore: number
  allowLate: boolean
}

export interface QuestionBankItem {
  id: string
  instructorId: string
  question: string
  type: QuestionType
  category: string
  difficulty: QuestionDifficulty
  courseTitle?: string
  tags: string[]
  usedIn: number
  points: number
  status: 'active' | 'archived'
}

export interface InstructorBatch {
  id: string
  instructorId: string
  name: string
  courseId: string
  courseTitle: string
  startDate: string
  endDate: string
  status: InstructorBatchStatus
  studentsCount: number
  maxCapacity: number
  schedule: string
  completionRate: number
}

export interface BulkImportRow {
  row: number
  instructorId: string
  name: string
  email: string
  course: string
  batch: string
  status: 'valid' | 'warning' | 'error'
  message?: string
}

export type QuestionType =
  | 'multiple-choice'
  | 'multiple-choice-multi'
  | 'true-false'
  | 'short-answer'
  | 'essay'
  | 'long-answer'
  | 'fill-blank'
  | 'matching'
  | 'ordering'
export type QuestionDifficulty = 'easy' | 'medium' | 'hard'
export type InstructorBatchStatus = 'active' | 'upcoming' | 'completed' | 'draft'

export const instructorPageMeta: Record<string, { title: string; subtitle: string }> = {
  '/instructor': { title: 'Overview', subtitle: 'Teaching & coaching hub' },
  '/instructor/courses': { title: 'Course Management', subtitle: 'Create and manage programs' },
  '/instructor/courses/new': { title: 'Create Course', subtitle: 'Build a new program' },
  '/instructor/students': { title: 'Students & Enrollments', subtitle: 'Learner roster and progress' },
  '/instructor/grades': { title: 'Grade Management', subtitle: 'Review and score submissions' },
  '/instructor/coaching': { title: 'Live Sessions', subtitle: 'Schedule coaching and live classes' },
  '/instructor/announcements': { title: 'Announcements', subtitle: 'Communicate with learners' },
  '/instructor/messages': { title: 'Messages', subtitle: 'Student and support conversations' },
  '/instructor/notifications': { title: 'Notifications', subtitle: 'Platform alerts and updates' },
  '/instructor/calendar': { title: 'Calendar', subtitle: 'Sessions, deadlines, and events' },
  '/instructor/analytics': { title: 'Analytics', subtitle: 'Engagement and performance insights' },
  '/instructor/earnings': { title: 'Earnings & Payouts', subtitle: 'Revenue and payout history' },
  '/instructor/profile': { title: 'Instructor Profile', subtitle: 'Public teaching profile' },
  '/instructor/settings': { title: 'Account Settings', subtitle: 'Preferences and security' },
  '/instructor/assignments': { title: 'Assignment Management', subtitle: 'Create and manage coursework' },
  '/instructor/quizzes': { title: 'Quiz Management', subtitle: 'Generic and course-linked assessments' },
  '/instructor/question-bank': { title: 'Question Bank', subtitle: 'Reusable assessment library' },
  '/instructor/batches': { title: 'Batch Management', subtitle: 'Cohorts and enrollment groups' },
  '/instructor/students/import': { title: 'Bulk Student Import', subtitle: 'Import enrollments from CSV' },
}

export const defaultCourseDraft: Omit<
  InstructorCourse,
  'id' | 'instructorId' | 'students' | 'completion' | 'rating' | 'reviewCount' | 'revenue' | 'updatedAt' | 'modules'
> = {
  title: '',
  subtitle: '',
  description: '',
  categoryId: 'cloud-devops',
  category: 'Cloud & DevOps',
  level: 'Intermediate',
  duration: '8 weeks',
  status: 'draft',
  price: '₹4,999',
  thumbnail: '',
  banner: '',
  learningOutcomes: [''],
  requirements: [''],
  visibility: 'public',
  coachingIncluded: true,
}

export const bulkImportTemplateColumns = ['full_name', 'email', 'course_slug', 'batch_name', 'phone', 'notes']
