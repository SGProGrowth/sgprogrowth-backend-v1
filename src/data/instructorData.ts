import { courseCategories, featuredCourses } from './homepageData'

export type CourseStatus = 'draft' | 'published' | 'archived'
export type LessonType = 'video' | 'pdf' | 'resource' | 'live' | 'quiz' | 'assignment'
export type PublishVisibility = 'public' | 'private' | 'invite'

export interface InstructorCourse {
  id: string
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
  title: string
  courseTitle: string
  message: string
  date: string
  audience: 'all' | 'course' | 'at-risk'
  status: 'sent' | 'scheduled' | 'draft'
}

export interface InstructorMessage {
  id: string
  from: string
  subject: string
  preview: string
  time: string
  read: boolean
  courseTitle?: string
}

export interface InstructorNotification {
  id: string
  title: string
  message: string
  time: string
  read: boolean
  type: 'enrollment' | 'submission' | 'review' | 'session' | 'system'
}

export interface CalendarEvent {
  id: string
  title: string
  date: string
  time: string
  type: 'session' | 'deadline' | 'live' | 'review'
  courseTitle?: string
}

export interface InstructorQuiz {
  id: string
  title: string
  courseId: string
  courseTitle: string
  questions: number
  duration: string
  attempts: number
  status: 'draft' | 'published'
}

export interface InstructorAssignment {
  id: string
  title: string
  courseId: string
  courseTitle: string
  dueDate: string
  type: 'project' | 'essay' | 'lab' | 'reflection'
  submissions: number
  status: 'draft' | 'published'
}

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
  '/instructor/profile': { title: 'Instructor Profile', subtitle: 'Public teaching profile' },
  '/instructor/settings': { title: 'Account Settings', subtitle: 'Preferences and security' },
}

export const instructorSummary = {
  totalStudents: 128,
  activeCourses: 4,
  avgCompletion: 78,
  sessionsThisWeek: 6,
  pendingGrades: 8,
  monthlyRevenue: '₹12,480',
  newEnrollments: 12,
}

export const defaultCourseDraft: Omit<InstructorCourse, 'id' | 'students' | 'completion' | 'rating' | 'reviewCount' | 'revenue' | 'updatedAt' | 'modules'> = {
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

export const instructorCourses: InstructorCourse[] = [
  {
    id: 'aws-solutions-architect',
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
]

export const categories = courseCategories

export const instructorStudents: InstructorStudent[] = [
  { id: 's1', name: 'Neha Sharma', email: 'neha@example.com', avatarInitials: 'NS', courseId: 'aws-solutions-architect', courseTitle: 'AWS Solutions Architect', enrolledDate: 'Apr 2026', progress: 68, lastActive: 'Today', status: 'active' },
  { id: 's2', name: 'Ankit Verma', email: 'ankit@example.com', avatarInitials: 'AV', courseId: 'aws-solutions-architect', courseTitle: 'AWS Solutions Architect', enrolledDate: 'Mar 2026', progress: 82, lastActive: 'Today', status: 'active' },
  { id: 's3', name: 'Riya Patel', email: 'riya@example.com', avatarInitials: 'RP', courseId: 'it-project-management', courseTitle: 'IT Project Management', enrolledDate: 'May 2026', progress: 54, lastActive: 'Yesterday', status: 'active' },
  { id: 's4', name: 'Priya K.', email: 'priya@example.com', avatarInitials: 'PK', courseId: 'it-project-management', courseTitle: 'IT Project Management', enrolledDate: 'May 2026', progress: 41, lastActive: '2 days ago', status: 'at-risk' },
  { id: 's5', name: 'Rahul M.', email: 'rahul@example.com', avatarInitials: 'RM', courseId: 'bni-trainers', courseTitle: 'BNI Trainers', enrolledDate: 'Feb 2026', progress: 100, lastActive: 'Jun 1', status: 'completed' },
]

export const gradeEntries: GradeEntry[] = [
  { id: 'g1', studentName: 'Neha Sharma', courseTitle: 'AWS Solutions Architect', assignmentTitle: 'VPC Architecture Design', submittedDate: 'Jun 24', score: null, maxScore: 100, status: 'pending' },
  { id: 'g2', studentName: 'Ankit Verma', courseTitle: 'AWS Solutions Architect', assignmentTitle: 'IAM Policy Reflection', submittedDate: 'Jun 23', score: 94, maxScore: 100, status: 'graded' },
  { id: 'g3', studentName: 'Riya Patel', courseTitle: 'IT Project Management', assignmentTitle: 'Stakeholder Plan', submittedDate: 'Jun 22', score: null, maxScore: 100, status: 'pending' },
  { id: 'g4', studentName: 'Priya K.', courseTitle: 'IT Project Management', assignmentTitle: 'Agile Workshop', submittedDate: 'Jun 18', score: 72, maxScore: 100, status: 'late' },
]

export const liveSessions: LiveSession[] = [
  { id: 'ls1', title: 'AWS Exam Strategy — 1:1', courseTitle: 'AWS Solutions Architect', studentName: 'Neha Sharma', date: 'Jun 26, 2026', time: '3:00 PM', duration: '60 min', type: '1:1', status: 'scheduled', meetingLink: 'https://teams.microsoft.com/l/meetup-join/aws-neha' },
  { id: 'ls2', title: 'Cloud Career Roadmap', courseTitle: 'AWS Solutions Architect', studentName: 'Ankit Verma', date: 'Jun 27, 2026', time: '11:00 AM', duration: '45 min', type: '1:1', status: 'scheduled', meetingLink: 'https://teams.microsoft.com/l/meetup-join/aws-ankit' },
  { id: 'ls3', title: 'PM Certification Prep', courseTitle: 'IT Project Management', studentName: 'Riya Patel', date: 'Jun 28, 2026', time: '2:00 PM', duration: '60 min', type: '1:1', status: 'scheduled', meetingLink: 'https://teams.microsoft.com/l/meetup-join/pm-riya' },
  { id: 'ls4', title: 'Weekly Office Hours', courseTitle: 'All courses', date: 'Jun 30, 2026', time: '10:00 AM', duration: '90 min', type: 'office-hours', status: 'scheduled', meetingLink: 'https://teams.microsoft.com/l/meetup-join/office-hours' },
]

export const announcements: Announcement[] = [
  { id: 'a1', title: 'Module 4 now available', courseTitle: 'AWS Solutions Architect', message: 'VPC & Networking module is now unlocked. Complete the lab before Friday.', date: 'Jun 24, 2026', audience: 'course', status: 'sent' },
  { id: 'a2', title: 'Practice exam this Friday', courseTitle: 'AWS Solutions Architect', message: 'Join the live practice exam review at 11:00 AM IST.', date: 'Jun 23, 2026', audience: 'course', status: 'sent' },
  { id: 'a3', title: 'At-risk learner check-in', courseTitle: 'IT Project Management', message: 'Schedule a coaching session if you need support catching up.', date: 'Jun 25, 2026', audience: 'at-risk', status: 'scheduled' },
]

export const instructorMessages: InstructorMessage[] = [
  { id: 'm1', from: 'Neha Sharma', subject: 'Question about VPC lab', preview: 'Hi Mahesh, I had a question about the subnet configuration in...', time: '2 hours ago', read: false, courseTitle: 'AWS Solutions Architect' },
  { id: 'm2', from: 'Riya Patel', subject: 'Assignment extension request', preview: 'Could I get a 2-day extension on the stakeholder plan?', time: '5 hours ago', read: false, courseTitle: 'IT Project Management' },
  { id: 'm3', from: 'Platform Support', subject: 'Payout processed', preview: 'Your June payout of ₹12,480 has been processed.', time: 'Yesterday', read: true },
]

export const instructorNotifications: InstructorNotification[] = [
  { id: 'n1', title: 'New enrollment', message: 'Riya Patel enrolled in IT Project Management', time: '2 hours ago', read: false, type: 'enrollment' },
  { id: 'n2', title: 'Submission pending review', message: 'Neha Sharma submitted VPC Architecture Design', time: '3 hours ago', read: false, type: 'submission' },
  { id: 'n3', title: 'New 5-star review', message: 'AWS Solutions Architect received a new review', time: '5 hours ago', read: false, type: 'review' },
  { id: 'n4', title: 'Session reminder', message: 'Coaching with Neha Sharma tomorrow at 3:00 PM', time: 'Yesterday', read: true, type: 'session' },
]

export const calendarEvents: CalendarEvent[] = [
  { id: 'c1', title: '1:1 — Neha Sharma', date: '2026-06-26', time: '3:00 PM', type: 'session', courseTitle: 'AWS Solutions Architect' },
  { id: 'c2', title: '1:1 — Ankit Verma', date: '2026-06-27', time: '11:00 AM', type: 'session', courseTitle: 'AWS Solutions Architect' },
  { id: 'c3', title: 'Assignment due — VPC Lab', date: '2026-06-27', time: '11:59 PM', type: 'deadline', courseTitle: 'AWS Solutions Architect' },
  { id: 'c4', title: 'Practice Exam Review', date: '2026-06-28', time: '11:00 AM', type: 'live', courseTitle: 'AWS Solutions Architect' },
  { id: 'c5', title: 'Office Hours', date: '2026-06-30', time: '10:00 AM', type: 'session' },
]

export const analyticsData = {
  enrollmentTrend: [12, 18, 15, 22, 19, 28, 24],
  completionTrend: [65, 68, 70, 72, 74, 76, 78],
  revenueTrend: [8200, 9100, 8800, 10200, 11400, 11800, 12480],
  topCourses: instructorCourses.filter((c) => c.status === 'published').slice(0, 3),
  engagementRate: 84,
  avgSessionRating: 4.9,
}

export const instructorQuizzes: InstructorQuiz[] = [
  { id: 'q1', title: 'Module 2 Knowledge Check', courseId: 'aws-solutions-architect', courseTitle: 'AWS Solutions Architect', questions: 20, duration: '30 min', attempts: 2, status: 'published' },
  { id: 'q2', title: 'AWS SAA Practice Exam — Set 1', courseId: 'aws-solutions-architect', courseTitle: 'AWS Solutions Architect', questions: 65, duration: '90 min', attempts: 3, status: 'published' },
  { id: 'q3', title: 'Agile Fundamentals Quiz', courseId: 'it-project-management', courseTitle: 'IT Project Management', questions: 15, duration: '20 min', attempts: 2, status: 'draft' },
]

export const instructorAssignments: InstructorAssignment[] = [
  { id: 'as1', title: 'VPC Architecture Design Document', courseId: 'aws-solutions-architect', courseTitle: 'AWS Solutions Architect', dueDate: 'Jun 27, 2026', type: 'project', submissions: 12, status: 'published' },
  { id: 'as2', title: 'IAM Policy Reflection', courseId: 'aws-solutions-architect', courseTitle: 'AWS Solutions Architect', dueDate: 'Jun 20, 2026', type: 'reflection', submissions: 28, status: 'published' },
  { id: 'as3', title: 'Stakeholder Communication Plan', courseId: 'it-project-management', courseTitle: 'IT Project Management', dueDate: 'Jun 30, 2026', type: 'essay', submissions: 5, status: 'published' },
]

export const instructorProfile = {
  name: 'Mahesh M.',
  title: 'Senior Cloud & Project Management Coach',
  bio: '15+ years in IT delivery and cloud architecture. Helping professionals achieve AWS and PMP certifications with coaching-led learning.',
  expertise: ['AWS Solutions Architect', 'PMP', 'Agile & Scrum', 'Career Coaching'],
  credentials: ['AWS Certified Solutions Architect', 'PMP', 'CSM'],
  publicUrl: 'sharvaconsulting.com/members-directory/maheshmdsharvagroup-com/',
  totalStudents: 128,
  coursesPublished: 4,
  avgRating: 4.8,
}

export function getCourseById(id: string): InstructorCourse | undefined {
  return instructorCourses.find((c) => c.id === id)
}

export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export const unreadInstructorNotifications = instructorNotifications.filter((n) => !n.read).length

export const recommendedFromCatalog = featuredCourses.slice(0, 2)
