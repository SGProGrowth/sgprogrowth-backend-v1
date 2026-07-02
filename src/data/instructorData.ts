import { courseCategories, featuredCourses } from './homepageData'

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

export const defaultCourseDraft: Omit<InstructorCourse, 'id' | 'instructorId' | 'students' | 'completion' | 'rating' | 'reviewCount' | 'revenue' | 'updatedAt' | 'modules'> = {
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

const awsModules: CourseModule[] = [
  {
    id: 'm1',
    title: 'Module 1: Cloud Foundations',
    order: 1,
    lessons: [
      { id: 'l1', title: 'Introduction to AWS', type: 'video', duration: '45 min', order: 1 },
      { id: 'l2', title: 'IAM Best Practices', type: 'video', duration: '35 min', order: 2 },
      { id: 'l3', title: 'IAM Policy Lab', type: 'assignment', duration: '1 hr', order: 3 },
    ],
  },
  {
    id: 'm2',
    title: 'Module 2: Compute & Storage',
    order: 2,
    lessons: [
      { id: 'l4', title: 'EC2 Deep Dive', type: 'video', duration: '55 min', order: 1 },
      { id: 'l5', title: 'S3 & Storage Classes', type: 'pdf', duration: '20 min', order: 2 },
      { id: 'l6', title: 'Module 2 Quiz', type: 'quiz', duration: '30 min', order: 3 },
    ],
  },
  {
    id: 'm3',
    title: 'Module 3: Networking',
    order: 3,
    lessons: [
      { id: 'l7', title: 'VPC Architecture', type: 'video', duration: '50 min', order: 1 },
      { id: 'l8', title: 'VPC Design Document', type: 'assignment', duration: '2 hrs', order: 2 },
      { id: 'l9', title: '1:1 Coaching — Exam Strategy', type: 'live', duration: '60 min', order: 3 },
    ],
  },
]

export const allInstructorCourses: InstructorCourse[] = [
  {
    id: 'aws-solutions-architect',
    instructorId: 'inst-001',
    title: 'AWS Solutions Architect Certification Prep',
    subtitle: 'Master AWS architecture and pass the SAA exam with coaching support',
    description: 'A coaching-led certification program covering EC2, S3, VPC, IAM, and exam strategy with 1:1 mentoring sessions.',
    categoryId: 'cloud-devops',
    category: 'Cloud & DevOps',
    level: 'Advanced',
    duration: '10 weeks',
    status: 'published',
    students: 45,
    completion: 72,
    rating: 4.8,
    reviewCount: 256,
    revenue: '₹4,860',
    price: '₹8,999',
    thumbnail: 'cloud',
    banner: 'cloud',
    learningOutcomes: [
      'Design resilient, high-performing AWS architectures',
      'Pass the AWS Solutions Architect Associate exam',
      'Apply cloud best practices in real-world projects',
    ],
    requirements: ['Basic IT knowledge', 'Familiarity with networking concepts', 'Commitment to 8–10 hrs/week'],
    visibility: 'public',
    coachingIncluded: true,
    updatedAt: 'Jun 24, 2026',
    modules: awsModules,
  },
  {
    id: 'it-project-management',
    instructorId: 'inst-002',
    title: 'IT Project Management Professional',
    subtitle: 'PMP-aligned project delivery for IT teams',
    description: 'Structured program for IT professionals pursuing PMP certification with stakeholder management and Agile frameworks.',
    categoryId: 'project-management',
    category: 'Project Management',
    level: 'Intermediate',
    duration: '6 weeks',
    status: 'published',
    students: 38,
    completion: 65,
    rating: 4.6,
    reviewCount: 89,
    revenue: '₹4,104',
    price: '₹4,999',
    thumbnail: 'project',
    banner: 'project',
    learningOutcomes: ['Lead IT projects using PMP frameworks', 'Manage stakeholders effectively', 'Prepare for PMP certification'],
    requirements: ['2+ years project experience recommended'],
    visibility: 'public',
    coachingIncluded: true,
    updatedAt: 'Jun 20, 2026',
    modules: [],
  },
  {
    id: 'bni-trainers',
    instructorId: 'inst-001',
    title: 'BNI Trainers and Coaches Power Team',
    subtitle: 'Private coaching program for BNI trainers',
    description: 'Exclusive program for BNI trainers and coaches — invitation only.',
    categoryId: 'leadership-coaching',
    category: 'Leadership & Coaching',
    level: 'Advanced',
    duration: '8 weeks',
    status: 'published',
    students: 22,
    completion: 81,
    rating: 4.9,
    reviewCount: 124,
    revenue: 'Private',
    price: 'Private',
    thumbnail: 'coaching',
    banner: 'coaching',
    learningOutcomes: ['Advanced coaching techniques', 'BNI power team leadership'],
    requirements: ['BNI membership', 'Invitation from program lead'],
    visibility: 'private',
    coachingIncluded: true,
    updatedAt: 'Jun 15, 2026',
    modules: [],
  },
  {
    id: 'demo-course',
    instructorId: 'inst-001',
    title: 'Career Discovery & Coaching Session',
    subtitle: 'Find your career direction before enrolling',
    description: 'Demo course for prospective students — coaching-first career assessment.',
    categoryId: 'leadership-coaching',
    category: 'Leadership & Coaching',
    level: 'Beginner',
    duration: '2 weeks',
    status: 'draft',
    students: 0,
    completion: 0,
    rating: 0,
    reviewCount: 0,
    revenue: '—',
    price: 'Apply to enroll',
    thumbnail: 'coaching',
    banner: 'coaching',
    learningOutcomes: ['Identify career goals', 'Receive personalized course recommendations'],
    requirements: ['None — open to all professionals'],
    visibility: 'public',
    coachingIncluded: true,
    updatedAt: 'Jun 10, 2026',
    modules: [],
  },
  {
    id: 'data-analytics-pro',
    instructorId: 'inst-003',
    title: 'Data Analytics Foundations',
    subtitle: 'SQL, Python, and BI for business analysts',
    description: 'Hands-on analytics program covering data cleaning, visualization, and dashboard delivery for early-career analysts.',
    categoryId: 'data-analytics',
    category: 'Data Analytics',
    level: 'Beginner',
    duration: '8 weeks',
    status: 'published',
    students: 23,
    completion: 58,
    rating: 4.7,
    reviewCount: 41,
    revenue: '₹2,760',
    price: '₹3,499',
    thumbnail: 'data',
    banner: 'data',
    learningOutcomes: ['Clean and transform datasets', 'Build dashboards in Power BI', 'Present insights to stakeholders'],
    requirements: ['Basic spreadsheet skills'],
    visibility: 'public',
    coachingIncluded: true,
    updatedAt: 'Jun 18, 2026',
    modules: [],
  },
]

export const categories = courseCategories

export const allInstructorStudents: InstructorStudent[] = [
  { id: 's1', name: 'Neha Sharma', email: 'neha@example.com', avatarInitials: 'NS', courseId: 'aws-solutions-architect', courseTitle: 'AWS Solutions Architect', enrolledDate: 'Apr 2026', progress: 68, lastActive: 'Today', status: 'active' },
  { id: 's2', name: 'Ankit Verma', email: 'ankit@example.com', avatarInitials: 'AV', courseId: 'aws-solutions-architect', courseTitle: 'AWS Solutions Architect', enrolledDate: 'Mar 2026', progress: 82, lastActive: 'Today', status: 'active' },
  { id: 's3', name: 'Riya Patel', email: 'riya@example.com', avatarInitials: 'RP', courseId: 'it-project-management', courseTitle: 'IT Project Management', enrolledDate: 'May 2026', progress: 54, lastActive: 'Yesterday', status: 'active' },
  { id: 's4', name: 'Priya K.', email: 'priya@example.com', avatarInitials: 'PK', courseId: 'it-project-management', courseTitle: 'IT Project Management', enrolledDate: 'May 2026', progress: 41, lastActive: '2 days ago', status: 'at-risk' },
  { id: 's5', name: 'Rahul M.', email: 'rahul@example.com', avatarInitials: 'RM', courseId: 'bni-trainers', courseTitle: 'BNI Trainers', enrolledDate: 'Feb 2026', progress: 100, lastActive: 'Jun 1', status: 'completed' },
  { id: 's6', name: 'Vikram Singh', email: 'vikram.s@example.com', avatarInitials: 'VS', courseId: 'data-analytics-pro', courseTitle: 'Data Analytics Foundations', enrolledDate: 'Jun 2026', progress: 35, lastActive: 'Today', status: 'active' },
  { id: 's7', name: 'Amit K.', email: 'amit@example.com', avatarInitials: 'AK', courseId: 'data-analytics-pro', courseTitle: 'Data Analytics Foundations', enrolledDate: 'Jun 2026', progress: 22, lastActive: 'Yesterday', status: 'active' },
]

export const allGradeEntries: GradeEntry[] = [
  { id: 'g1', instructorId: 'inst-001', studentName: 'Neha Sharma', courseTitle: 'AWS Solutions Architect', assignmentTitle: 'VPC Architecture Design', submittedDate: 'Jun 24', score: null, maxScore: 100, status: 'pending' },
  { id: 'g2', instructorId: 'inst-001', studentName: 'Ankit Verma', courseTitle: 'AWS Solutions Architect', assignmentTitle: 'IAM Policy Reflection', submittedDate: 'Jun 23', score: 94, maxScore: 100, status: 'graded' },
  { id: 'g3', instructorId: 'inst-002', studentName: 'Riya Patel', courseTitle: 'IT Project Management', assignmentTitle: 'Stakeholder Plan', submittedDate: 'Jun 22', score: null, maxScore: 100, status: 'pending' },
  { id: 'g4', instructorId: 'inst-002', studentName: 'Priya K.', courseTitle: 'IT Project Management', assignmentTitle: 'Agile Workshop', submittedDate: 'Jun 18', score: 72, maxScore: 100, status: 'late' },
  { id: 'g5', instructorId: 'inst-003', studentName: 'Vikram Singh', courseTitle: 'Data Analytics Foundations', assignmentTitle: 'Sales Dataset Cleaning', submittedDate: 'Jun 25', score: null, maxScore: 50, status: 'pending' },
]

export const allLiveSessions: LiveSession[] = [
  { id: 'ls1', instructorId: 'inst-001', title: 'AWS Exam Strategy — 1:1', courseTitle: 'AWS Solutions Architect', studentName: 'Neha Sharma', date: 'Jun 26, 2026', time: '3:00 PM', duration: '60 min', type: '1:1', status: 'scheduled', meetingLink: 'https://teams.microsoft.com/l/meetup-join/aws-neha' },
  { id: 'ls2', instructorId: 'inst-001', title: 'Cloud Career Roadmap', courseTitle: 'AWS Solutions Architect', studentName: 'Ankit Verma', date: 'Jun 27, 2026', time: '11:00 AM', duration: '45 min', type: '1:1', status: 'scheduled', meetingLink: 'https://teams.microsoft.com/l/meetup-join/aws-ankit' },
  { id: 'ls3', instructorId: 'inst-002', title: 'PM Certification Prep', courseTitle: 'IT Project Management', studentName: 'Riya Patel', date: 'Jun 28, 2026', time: '2:00 PM', duration: '60 min', type: '1:1', status: 'scheduled', meetingLink: 'https://teams.microsoft.com/l/meetup-join/pm-riya' },
  { id: 'ls4', instructorId: 'inst-001', title: 'Weekly Office Hours', courseTitle: 'All courses', date: 'Jun 30, 2026', time: '10:00 AM', duration: '90 min', type: 'office-hours', status: 'scheduled', meetingLink: 'https://teams.microsoft.com/l/meetup-join/office-hours' },
  { id: 'ls5', instructorId: 'inst-003', title: 'SQL Lab Walkthrough', courseTitle: 'Data Analytics Foundations', studentName: 'Vikram Singh', date: 'Jun 29, 2026', time: '5:00 PM', duration: '45 min', type: '1:1', status: 'scheduled', meetingLink: 'https://teams.microsoft.com/l/meetup-join/data-vikram' },
]

export const allAnnouncements: Announcement[] = [
  { id: 'a1', instructorId: 'inst-001', title: 'Module 4 now available', courseTitle: 'AWS Solutions Architect', message: 'VPC & Networking module is now unlocked. Complete the lab before Friday.', date: 'Jun 24, 2026', audience: 'course', status: 'sent' },
  { id: 'a2', instructorId: 'inst-001', title: 'Practice exam this Friday', courseTitle: 'AWS Solutions Architect', message: 'Join the live practice exam review at 11:00 AM IST.', date: 'Jun 23, 2026', audience: 'course', status: 'sent' },
  { id: 'a3', instructorId: 'inst-002', title: 'At-risk learner check-in', courseTitle: 'IT Project Management', message: 'Schedule a coaching session if you need support catching up.', date: 'Jun 25, 2026', audience: 'at-risk', status: 'scheduled' },
  { id: 'a4', instructorId: 'inst-003', title: 'Power BI module released', courseTitle: 'Data Analytics Foundations', message: 'Module 3 on dashboard design is now available.', date: 'Jun 24, 2026', audience: 'course', status: 'sent' },
]

export const allInstructorMessages: InstructorMessage[] = [
  { id: 'm1', instructorId: 'inst-001', from: 'Neha Sharma', subject: 'Question about VPC lab', preview: 'Hi, I had a question about the subnet configuration in the VPC lab…', time: '2 hours ago', read: false, courseTitle: 'AWS Solutions Architect' },
  { id: 'm2', instructorId: 'inst-002', from: 'Riya Patel', subject: 'Assignment extension request', preview: 'Could I get a 2-day extension on the stakeholder plan?', time: '5 hours ago', read: false, courseTitle: 'IT Project Management' },
  { id: 'm3', instructorId: 'inst-001', from: 'Platform Support', subject: 'Payout processed', preview: 'Your June payout has been processed to your registered account.', time: 'Yesterday', read: true },
  { id: 'm4', instructorId: 'inst-003', from: 'Vikram Singh', subject: 'SQL join clarification', preview: 'Could you explain the difference between INNER and LEFT joins?', time: '3 hours ago', read: false, courseTitle: 'Data Analytics Foundations' },
]

export const allInstructorNotifications: InstructorNotification[] = [
  { id: 'n1', instructorId: 'inst-002', title: 'New enrollment', message: 'Riya Patel enrolled in IT Project Management', time: '2 hours ago', read: false, type: 'enrollment' },
  { id: 'n2', instructorId: 'inst-001', title: 'Submission pending review', message: 'Neha Sharma submitted VPC Architecture Design', time: '3 hours ago', read: false, type: 'submission' },
  { id: 'n3', instructorId: 'inst-001', title: 'New 5-star review', message: 'AWS Solutions Architect received a new review', time: '5 hours ago', read: false, type: 'review' },
  { id: 'n4', instructorId: 'inst-001', title: 'Session reminder', message: 'Coaching with Neha Sharma tomorrow at 3:00 PM', time: 'Yesterday', read: true, type: 'session' },
  { id: 'n5', instructorId: 'inst-003', title: 'New enrollment', message: 'Amit K. enrolled in Data Analytics Foundations', time: '4 hours ago', read: false, type: 'enrollment' },
]

export const allCalendarEvents: CalendarEvent[] = [
  { id: 'c1', instructorId: 'inst-001', title: '1:1 — Neha Sharma', date: '2026-06-26', time: '3:00 PM', type: 'session', courseTitle: 'AWS Solutions Architect' },
  { id: 'c2', instructorId: 'inst-001', title: '1:1 — Ankit Verma', date: '2026-06-27', time: '11:00 AM', type: 'session', courseTitle: 'AWS Solutions Architect' },
  { id: 'c3', instructorId: 'inst-001', title: 'Assignment due — VPC Lab', date: '2026-06-27', time: '11:59 PM', type: 'deadline', courseTitle: 'AWS Solutions Architect' },
  { id: 'c4', instructorId: 'inst-001', title: 'Practice Exam Review', date: '2026-06-28', time: '11:00 AM', type: 'live', courseTitle: 'AWS Solutions Architect' },
  { id: 'c5', instructorId: 'inst-001', title: 'Office Hours', date: '2026-06-30', time: '10:00 AM', type: 'session' },
  { id: 'c6', instructorId: 'inst-002', title: '1:1 — Riya Patel', date: '2026-06-28', time: '2:00 PM', type: 'session', courseTitle: 'IT Project Management' },
  { id: 'c7', instructorId: 'inst-003', title: 'SQL Lab Office Hours', date: '2026-06-29', time: '5:00 PM', type: 'session', courseTitle: 'Data Analytics Foundations' },
]

export const allAnalyticsByInstructor: Record<string, {
  enrollmentTrend: number[]
  completionTrend: number[]
  revenueTrend: number[]
  topCourses: InstructorCourse[]
  engagementRate: number
  avgSessionRating: number
}> = {
  'inst-001': {
    enrollmentTrend: [8, 12, 10, 15, 14, 18, 16],
    completionTrend: [68, 70, 71, 72, 73, 74, 72],
    revenueTrend: [6200, 7100, 6800, 8200, 9100, 9800, 9860],
    topCourses: [],
    engagementRate: 86,
    avgSessionRating: 4.9,
  },
  'inst-002': {
    enrollmentTrend: [4, 6, 5, 7, 6, 8, 7],
    completionTrend: [58, 60, 62, 63, 64, 65, 65],
    revenueTrend: [3200, 3400, 3300, 3600, 3800, 4000, 4104],
    topCourses: [],
    engagementRate: 79,
    avgSessionRating: 4.6,
  },
  'inst-003': {
    enrollmentTrend: [2, 4, 5, 6, 7, 8, 9],
    completionTrend: [45, 48, 50, 52, 55, 56, 58],
    revenueTrend: [800, 1200, 1400, 1600, 2000, 2400, 2760],
    topCourses: [],
    engagementRate: 81,
    avgSessionRating: 4.7,
  },
  default: {
    enrollmentTrend: [0, 0, 0, 0, 0, 0, 0],
    completionTrend: [0, 0, 0, 0, 0, 0, 0],
    revenueTrend: [0, 0, 0, 0, 0, 0, 0],
    topCourses: [],
    engagementRate: 0,
    avgSessionRating: 0,
  },
}

// Populate topCourses per instructor
allAnalyticsByInstructor['inst-001'].topCourses = allInstructorCourses.filter((c) => c.instructorId === 'inst-001' && c.status === 'published').slice(0, 3)
allAnalyticsByInstructor['inst-002'].topCourses = allInstructorCourses.filter((c) => c.instructorId === 'inst-002' && c.status === 'published').slice(0, 3)
allAnalyticsByInstructor['inst-003'].topCourses = allInstructorCourses.filter((c) => c.instructorId === 'inst-003' && c.status === 'published').slice(0, 3)

export const allInstructorQuizzes: InstructorQuiz[] = [
  { id: 'q1', instructorId: 'inst-001', title: 'Module 2 Knowledge Check', courseId: 'aws-solutions-architect', courseTitle: 'AWS Solutions Architect', questions: 20, duration: '30 min', attempts: 2, status: 'published', isGeneric: false, passScore: 70, lastUpdated: 'Jun 20, 2026' },
  { id: 'q2', instructorId: 'inst-001', title: 'AWS SAA Practice Exam — Set 1', courseId: 'aws-solutions-architect', courseTitle: 'AWS Solutions Architect', questions: 65, duration: '90 min', attempts: 3, status: 'published', isGeneric: false, passScore: 72, lastUpdated: 'Jun 15, 2026' },
  { id: 'q3', instructorId: 'inst-002', title: 'Agile Fundamentals Quiz', courseId: 'it-project-management', courseTitle: 'IT Project Management', questions: 15, duration: '20 min', attempts: 2, status: 'draft', isGeneric: false, passScore: 60, lastUpdated: 'Jun 22, 2026' },
  { id: 'q4', instructorId: 'inst-001', title: 'Cloud Literacy Assessment', courseId: null, courseTitle: 'All courses', questions: 25, duration: '35 min', attempts: 1, status: 'published', isGeneric: true, passScore: 65, lastUpdated: 'Jun 10, 2026' },
  { id: 'q5', instructorId: 'inst-002', title: 'IT Fundamentals Diagnostic', courseId: null, courseTitle: 'All courses', questions: 30, duration: '40 min', attempts: 2, status: 'published', isGeneric: true, passScore: 60, lastUpdated: 'May 28, 2026' },
  { id: 'q6', instructorId: 'inst-003', title: 'SQL Basics Check', courseId: 'data-analytics-pro', courseTitle: 'Data Analytics Foundations', questions: 18, duration: '25 min', attempts: 1, status: 'published', isGeneric: false, passScore: 70, lastUpdated: 'Jun 24, 2026' },
]

export const allInstructorAssignments: InstructorAssignment[] = [
  { id: 'as1', instructorId: 'inst-001', title: 'VPC Architecture Design Document', courseId: 'aws-solutions-architect', courseTitle: 'AWS Solutions Architect', dueDate: 'Jun 27, 2026', type: 'project', submissions: 12, totalStudents: 45, status: 'published', maxScore: 100, allowLate: false },
  { id: 'as2', instructorId: 'inst-001', title: 'IAM Policy Reflection', courseId: 'aws-solutions-architect', courseTitle: 'AWS Solutions Architect', dueDate: 'Jun 20, 2026', type: 'reflection', submissions: 28, totalStudents: 45, status: 'published', maxScore: 100, allowLate: true },
  { id: 'as3', instructorId: 'inst-002', title: 'Stakeholder Communication Plan', courseId: 'it-project-management', courseTitle: 'IT Project Management', dueDate: 'Jun 30, 2026', type: 'essay', submissions: 5, totalStudents: 38, status: 'published', maxScore: 100, allowLate: true },
  { id: 'as4', instructorId: 'inst-002', title: 'Agile Sprint Planning Lab', courseId: 'it-project-management', courseTitle: 'IT Project Management', dueDate: 'Jul 5, 2026', type: 'lab', submissions: 0, totalStudents: 38, status: 'draft', maxScore: 50, allowLate: false },
  { id: 'as5', instructorId: 'inst-003', title: 'Data Cleaning — Sales Dataset', courseId: 'data-analytics-pro', courseTitle: 'Data Analytics Foundations', dueDate: 'Jul 10, 2026', type: 'lab', submissions: 3, totalStudents: 23, status: 'published', maxScore: 40, allowLate: true },
]

export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export const recommendedFromCatalog = featuredCourses.slice(0, 2)

export const allQuestionBankItems: QuestionBankItem[] = [
  { id: 'qb1', instructorId: 'inst-001', question: 'Which AWS service provides object storage with 99.999999999% durability?', type: 'multiple-choice', category: 'Cloud Storage', difficulty: 'easy', courseTitle: 'AWS Solutions Architect', tags: ['S3', 'Storage'], usedIn: 3, points: 2, status: 'active' },
  { id: 'qb2', instructorId: 'inst-001', question: 'Explain the difference between Security Groups and NACLs in AWS VPC.', type: 'essay', category: 'Networking', difficulty: 'hard', courseTitle: 'AWS Solutions Architect', tags: ['VPC', 'Security'], usedIn: 2, points: 10, status: 'active' },
  { id: 'qb3', instructorId: 'inst-001', question: 'IAM roles can be attached to EC2 instances without storing credentials.', type: 'true-false', category: 'Identity & Access', difficulty: 'easy', courseTitle: 'AWS Solutions Architect', tags: ['IAM'], usedIn: 4, points: 1, status: 'active' },
  { id: 'qb4', instructorId: 'inst-002', question: 'What is the critical path in project scheduling?', type: 'short-answer', category: 'Project Management', difficulty: 'medium', courseTitle: 'IT Project Management', tags: ['Scheduling', 'PMP'], usedIn: 2, points: 5, status: 'active' },
  { id: 'qb5', instructorId: 'inst-002', question: 'Describe three key stakeholder management strategies for IT projects.', type: 'essay', category: 'Stakeholder Management', difficulty: 'medium', courseTitle: 'IT Project Management', tags: ['Stakeholders'], usedIn: 1, points: 8, status: 'active' },
  { id: 'qb6', instructorId: 'inst-002', question: 'Agile sprints should always be exactly 2 weeks long.', type: 'true-false', category: 'Agile', difficulty: 'easy', tags: ['Agile', 'Scrum'], usedIn: 2, points: 1, status: 'active' },
  { id: 'qb7', instructorId: 'inst-003', question: 'Which normalization form eliminates partial dependencies?', type: 'multiple-choice', category: 'Data Analytics', difficulty: 'medium', courseTitle: 'Data Analytics Foundations', tags: ['SQL', 'Database'], usedIn: 1, points: 3, status: 'active' },
  { id: 'qb8', instructorId: 'inst-001', question: 'Legacy question — EC2 instance types (2019 syllabus)', type: 'multiple-choice', category: 'Cloud Compute', difficulty: 'easy', courseTitle: 'AWS Solutions Architect', tags: ['EC2', 'Legacy'], usedIn: 0, points: 2, status: 'archived' },
]

export const allInstructorBatches: InstructorBatch[] = [
  { id: 'ib1', instructorId: 'inst-001', name: 'AWS SAA — June 2026 Cohort', courseId: 'aws-solutions-architect', courseTitle: 'AWS Solutions Architect', startDate: 'Jun 1, 2026', endDate: 'Aug 15, 2026', status: 'active', studentsCount: 24, maxCapacity: 30, schedule: 'Tue & Thu · 6:00–8:00 PM IST', completionRate: 68 },
  { id: 'ib2', instructorId: 'inst-002', name: 'IT PM — May 2026 Batch', courseId: 'it-project-management', courseTitle: 'IT Project Management', startDate: 'May 12, 2026', endDate: 'Jul 24, 2026', status: 'active', studentsCount: 18, maxCapacity: 25, schedule: 'Wed · 7:00–9:00 PM IST', completionRate: 54 },
  { id: 'ib3', instructorId: 'inst-001', name: 'BNI Coaches — Private Batch', courseId: 'bni-trainers', courseTitle: 'BNI Trainers & Coaches', startDate: 'Feb 1, 2026', endDate: 'Apr 30, 2026', status: 'completed', studentsCount: 22, maxCapacity: 25, schedule: 'Sat · 10:00 AM–1:00 PM IST', completionRate: 81 },
  { id: 'ib4', instructorId: 'inst-003', name: 'Data Analytics — Aug 2026 Intake', courseId: 'data-analytics-pro', courseTitle: 'Data Analytics Foundations', startDate: 'Aug 4, 2026', endDate: 'Oct 12, 2026', status: 'upcoming', studentsCount: 8, maxCapacity: 20, schedule: 'Mon & Fri · 6:30–8:00 PM IST', completionRate: 0 },
  { id: 'ib5', instructorId: 'inst-001', name: 'AWS SAA — September 2026', courseId: 'aws-solutions-architect', courseTitle: 'AWS Solutions Architect', startDate: 'Sep 8, 2026', endDate: 'Nov 20, 2026', status: 'draft', studentsCount: 0, maxCapacity: 30, schedule: 'TBD', completionRate: 0 },
]

export const allBulkImportPreviewRows: BulkImportRow[] = [
  { row: 1, instructorId: 'inst-001', name: 'Sneha Desai', email: 'sneha.d@example.com', course: 'AWS Solutions Architect', batch: 'AWS SAA — June 2026', status: 'valid' },
  { row: 2, instructorId: 'inst-001', name: 'Vikram Singh', email: 'vikram.s@example.com', course: 'AWS Solutions Architect', batch: 'AWS SAA — June 2026', status: 'valid' },
  { row: 3, instructorId: 'inst-002', name: 'Amit K.', email: 'amit@example.com', course: 'IT Project Management', batch: 'IT PM — May 2026', status: 'valid' },
  { row: 4, instructorId: 'inst-001', name: 'Priya K.', email: 'priya@example.com', course: 'AWS Solutions Architect', batch: 'AWS SAA — June 2026', status: 'warning', message: 'Already enrolled in this course' },
  { row: 5, instructorId: 'inst-001', name: 'Invalid Row', email: 'not-an-email', course: 'Unknown Course', batch: '', status: 'error', message: 'Invalid email and course not found' },
  { row: 1, instructorId: 'inst-003', name: 'Learner A', email: 'learner.a@example.com', course: 'Data Analytics Foundations', batch: 'Aug 2026 Intake', status: 'valid' },
]

export const bulkImportTemplateColumns = ['full_name', 'email', 'course_slug', 'batch_name', 'phone', 'notes']
