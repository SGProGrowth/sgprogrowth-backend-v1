import { featuredCourses } from './homepageData'

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

/* ── Learning summary ── */

export const learningSummary = {
  totalHours: 42,
  weeklyHours: 8,
  weeklyGoal: 10,
  activeCourses: 3,
  completedCourses: 1,
  streak: 12,
  longestStreak: 18,
  overallProgress: 54,
  certificationsInProgress: 2,
  coachingSessionsThisMonth: 4,
}

export const weeklyLearning: WeeklyLearning[] = [
  { day: 'Mon', hours: 1.5, active: true },
  { day: 'Tue', hours: 2, active: true },
  { day: 'Wed', hours: 0.5, active: true },
  { day: 'Thu', hours: 1.5, active: true },
  { day: 'Fri', hours: 2, active: true },
  { day: 'Sat', hours: 0.5, active: true },
  { day: 'Sun', hours: 0, active: false },
]

/* ── Courses ── */

export const enrolledCourses: EnrolledCourse[] = [
  {
    id: 'aws-solutions-architect',
    title: 'AWS Solutions Architect Certification Prep',
    instructor: 'Cloud Academy · SG Pro Growth',
    coach: 'Aanya Mehta',
    category: 'Cloud & DevOps',
    level: 'Advanced',
    duration: '10 weeks',
    progress: 68,
    modulesCompleted: 7,
    totalModules: 10,
    lastAccessed: 'Today',
    nextLesson: 'Module 4: VPC & Networking',
    status: 'active',
    thumbnail: 'cloud',
    rating: 4.9,
    hoursSpent: 24,
  },
  {
    id: 'it-project-management',
    title: 'IT Project Management Professional',
    instructor: 'Aanya Mehta · SG Pro Growth',
    coach: 'Rohan Kapoor',
    category: 'Project Management',
    level: 'Intermediate',
    duration: '6 weeks',
    progress: 34,
    modulesCompleted: 4,
    totalModules: 12,
    lastAccessed: 'Yesterday',
    nextLesson: 'Stakeholder management workshop',
    status: 'active',
    thumbnail: 'project',
    rating: 4.6,
    hoursSpent: 11,
  },
  {
    id: 'data-analytics-pro',
    title: 'Google Data Analytics Professional Certificate',
    instructor: 'Data Labs · SG Pro Growth',
    coach: 'Aanya Mehta',
    category: 'Data & Analytics',
    level: 'Beginner',
    duration: '12 weeks',
    progress: 12,
    modulesCompleted: 1,
    totalModules: 8,
    lastAccessed: '2 days ago',
    nextLesson: 'Orientation & goal setting',
    status: 'active',
    thumbnail: 'data',
    rating: 4.8,
    hoursSpent: 4,
  },
  {
    id: 'demo-course',
    title: 'Career Discovery & Coaching Session',
    instructor: 'Rohan Kapoor · SG Pro Growth',
    coach: 'Rohan Kapoor',
    category: 'Leadership & Coaching',
    level: 'Beginner',
    duration: '2 weeks',
    progress: 100,
    modulesCompleted: 4,
    totalModules: 4,
    lastAccessed: 'May 2026',
    nextLesson: 'Completed',
    status: 'completed',
    thumbnail: 'coaching',
    rating: 5.0,
    hoursSpent: 6,
  },
]

export const recommendedCourses = featuredCourses
  .filter((c) => !enrolledCourses.some((e) => e.id === c.id))
  .slice(0, 3)
  .map((c) => ({
    id: c.id,
    title: c.title,
    instructor: c.instructor,
    category: c.category,
    level: c.level,
    duration: c.duration,
    rating: c.rating,
    reviewCount: c.reviewCount,
    price: c.price,
    badge: c.badge,
    reason: c.trending ? 'Trending in your field' : c.isNew ? 'New program' : 'Recommended by your coach',
  }))

export const continueLearning = enrolledCourses
  .filter((c) => c.status === 'active')
  .sort((a, b) => b.progress - a.progress)[0]

/* ── Milestones & roadmap ── */

export const learningMilestones: LearningMilestone[] = [
  {
    id: 'm1',
    phase: 'Coaching First',
    title: 'Career assessment & goal setting',
    description: 'Identified cloud engineering as primary career direction with coach guidance.',
    status: 'completed',
    date: 'May 2026',
    courseId: 'demo-course',
  },
  {
    id: 'm2',
    phase: 'Guided Learning',
    title: 'AWS Solutions Architect — Core modules',
    description: 'Completed EC2, S3, IAM, and networking fundamentals.',
    status: 'in-progress',
    date: 'Jun–Aug 2026',
    courseId: 'aws-solutions-architect',
  },
  {
    id: 'm3',
    phase: 'Certification',
    title: 'AWS SAA practice exams',
    description: 'Target score above 80% on three consecutive practice tests.',
    status: 'in-progress',
    date: 'Aug 2026',
    courseId: 'aws-solutions-architect',
  },
  {
    id: 'm4',
    phase: 'Career Growth',
    title: 'Interview prep & placement support',
    description: 'Mock interviews and portfolio review with career coach.',
    status: 'upcoming',
    date: 'Oct 2026',
  },
]

export const courseProgressDetails = enrolledCourses
  .filter((c) => c.status === 'active')
  .map((c) => ({
    courseId: c.id,
    title: c.title,
    progress: c.progress,
    modules: Array.from({ length: c.totalModules }, (_, i) => ({
      number: i + 1,
      title: i < c.modulesCompleted ? `Module ${i + 1}` : i === c.modulesCompleted ? c.nextLesson : `Module ${i + 1}`,
      status: i < c.modulesCompleted ? ('completed' as const) : i === c.modulesCompleted ? ('current' as const) : ('locked' as const),
    })),
  }))

/* ── Assignments ── */

export const assignments: Assignment[] = [
  {
    id: 'a1',
    title: 'VPC Architecture Design Document',
    courseId: 'aws-solutions-architect',
    courseTitle: 'AWS Solutions Architect',
    dueDate: '2026-06-27',
    dueLabel: 'Due tomorrow',
    status: 'pending',
    type: 'project',
  },
  {
    id: 'a2',
    title: 'Stakeholder Communication Plan',
    courseId: 'it-project-management',
    courseTitle: 'IT Project Management',
    dueDate: '2026-06-30',
    dueLabel: 'Due in 4 days',
    status: 'pending',
    type: 'essay',
  },
  {
    id: 'a3',
    title: 'Data Cleaning Lab — Sales Dataset',
    courseId: 'data-analytics-pro',
    courseTitle: 'Data Analytics',
    dueDate: '2026-06-25',
    dueLabel: 'Due today',
    status: 'overdue',
    type: 'lab',
  },
  {
    id: 'a4',
    title: 'IAM Policy Best Practices Reflection',
    courseId: 'aws-solutions-architect',
    courseTitle: 'AWS Solutions Architect',
    dueDate: '2026-06-20',
    dueLabel: 'Submitted Jun 20',
    status: 'graded',
    score: 92,
    maxScore: 100,
    type: 'reflection',
  },
  {
    id: 'a5',
    title: 'Career Goals Worksheet',
    courseId: 'demo-course',
    courseTitle: 'Career Discovery',
    dueDate: '2026-05-15',
    dueLabel: 'Completed May 15',
    status: 'graded',
    score: 100,
    maxScore: 100,
    type: 'reflection',
  },
]

/* ── Quizzes ── */

export const quizzes: Quiz[] = [
  {
    id: 'q1',
    title: 'AWS SAA Practice Exam — Set 2',
    courseId: 'aws-solutions-architect',
    courseTitle: 'AWS Solutions Architect',
    date: '2026-06-28',
    dateLabel: 'Friday · 11:00 AM',
    status: 'upcoming',
    maxScore: 100,
    attempts: 0,
    maxAttempts: 3,
    duration: '90 min',
  },
  {
    id: 'q2',
    title: 'VPC & Networking Knowledge Check',
    courseId: 'aws-solutions-architect',
    courseTitle: 'AWS Solutions Architect',
    date: '2026-06-22',
    dateLabel: 'Completed Jun 22',
    status: 'completed',
    score: 88,
    maxScore: 100,
    attempts: 1,
    maxAttempts: 2,
    duration: '30 min',
  },
  {
    id: 'q3',
    title: 'Agile Fundamentals Quiz',
    courseId: 'it-project-management',
    courseTitle: 'IT Project Management',
    date: '2026-07-02',
    dateLabel: 'Jul 2 · Self-paced',
    status: 'upcoming',
    maxScore: 50,
    attempts: 0,
    maxAttempts: 2,
    duration: '20 min',
  },
  {
    id: 'q4',
    title: 'Module 3 Assessment — EC2 & Storage',
    courseId: 'aws-solutions-architect',
    courseTitle: 'AWS Solutions Architect',
    date: '2026-06-10',
    dateLabel: 'Completed Jun 10',
    status: 'completed',
    score: 94,
    maxScore: 100,
    attempts: 1,
    maxAttempts: 2,
    duration: '45 min',
  },
  {
    id: 'q5',
    title: 'Data Types & Structures Quiz',
    courseId: 'data-analytics-pro',
    courseTitle: 'Data Analytics',
    date: '2026-07-05',
    dateLabel: 'Jul 5 · Self-paced',
    status: 'upcoming',
    maxScore: 40,
    attempts: 0,
    maxAttempts: 3,
    duration: '15 min',
  },
]

export const quizAnalytics = {
  averageScore: 91,
  quizzesTaken: 2,
  passRate: 100,
  strongestArea: 'Cloud Infrastructure',
  needsImprovement: 'Project Scheduling',
  recentScores: [94, 88],
  trend: '+3%' as const,
}

/* ── Certificates ── */

export const earnedCertificates: Certificate[] = [
  {
    id: 'cert-1',
    title: 'Career Discovery & Coaching Completion',
    courseId: 'demo-course',
    issuedDate: 'May 15, 2026',
    credentialId: 'SGPG-CD-2026-00482',
    instructor: 'Rohan Kapoor',
    skills: ['Career Planning', 'Goal Setting', 'Self-Assessment'],
  },
]

export const certificateTimeline = [
  { date: 'May 2026', event: 'Career Discovery certificate earned', type: 'certificate' as const },
  { date: 'Jun 2026', event: 'Started AWS Solutions Architect track', type: 'enrollment' as const },
  { date: 'Jun 2026', event: 'Achieved 12-day learning streak', type: 'achievement' as const },
  { date: 'Aug 2026', event: 'AWS SAA certification target', type: 'upcoming' as const },
]

/* ── Notifications ── */

export const notifications: Notification[] = [
  {
    id: 'n1',
    type: 'deadline',
    title: 'Assignment due today',
    message: 'Data Cleaning Lab — Sales Dataset is due by 11:59 PM tonight.',
    time: '2 hours ago',
    read: false,
    actionLabel: 'View assignment',
    actionHref: '/dashboard/assignments',
  },
  {
    id: 'n2',
    type: 'coaching',
    title: 'Coaching session tomorrow',
    message: 'Your 1:1 with Aanya Mehta on AWS exam strategy is scheduled for 3:00 PM.',
    time: '5 hours ago',
    read: false,
    actionLabel: 'View schedule',
    actionHref: '/dashboard/coaching',
  },
  {
    id: 'n3',
    type: 'course',
    title: 'New module available',
    message: 'Module 4: VPC & Networking is now unlocked in AWS Solutions Architect.',
    time: 'Yesterday',
    read: false,
    actionLabel: 'Continue learning',
    actionHref: '/dashboard/courses',
  },
  {
    id: 'n4',
    type: 'announcement',
    title: 'Platform update',
    message: 'Practice exam review sessions are now available every Friday with your coach.',
    time: '2 days ago',
    read: true,
  },
  {
    id: 'n5',
    type: 'achievement',
    title: '12-day streak!',
    message: 'You have learned for 12 consecutive days. Keep the momentum going.',
    time: '3 days ago',
    read: true,
  },
  {
    id: 'n6',
    type: 'deadline',
    title: 'Quiz this Friday',
    message: 'AWS SAA Practice Exam — Set 2 opens Friday at 11:00 AM.',
    time: '4 days ago',
    read: true,
    actionHref: '/dashboard/quizzes',
  },
]

export const unreadNotificationCount = notifications.filter((n) => !n.read).length

/* ── Upcoming activities (overview) ── */

export const upcomingActivities: UpcomingActivity[] = [
  {
    id: 'u1',
    title: '1:1 Coaching session',
    subtitle: 'AWS exam strategy · with Aanya Mehta',
    datetime: 'Tomorrow · 3:00 PM',
    type: 'coaching',
    courseId: 'aws-solutions-architect',
  },
  {
    id: 'u2',
    title: 'Module 4: VPC & Networking',
    subtitle: 'Self-paced · ~2 hrs · AWS Solutions Architect',
    datetime: 'Continue today',
    type: 'module',
    courseId: 'aws-solutions-architect',
  },
  {
    id: 'u3',
    title: 'Data Cleaning Lab',
    subtitle: 'Assignment · Data Analytics',
    datetime: 'Due today',
    type: 'assignment',
    courseId: 'data-analytics-pro',
  },
  {
    id: 'u4',
    title: 'AWS SAA Practice Exam — Set 2',
    subtitle: 'Live review · with Aanya Mehta',
    datetime: 'Friday · 11:00 AM',
    type: 'quiz',
    courseId: 'aws-solutions-architect',
  },
  {
    id: 'u5',
    title: 'Career roadmap check-in',
    subtitle: 'Coaching · Goal alignment session',
    datetime: 'Mon · 10:00 AM',
    type: 'coaching',
  },
]

/* ── Profile defaults ── */

export const defaultLearningPreferences = {
  weeklyGoalHours: 10,
  emailNotifications: true,
  deadlineReminders: true,
  coachingReminders: true,
  courseUpdates: true,
  timezone: 'Asia/Kolkata',
  learningPace: 'moderate' as const,
  preferredCategories: ['Cloud & DevOps', 'Project Management'],
}

export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function getActiveCourses() {
  return enrolledCourses.filter((c) => c.status === 'active')
}

export function getCompletedCourses() {
  return enrolledCourses.filter((c) => c.status === 'completed')
}

export function getPendingAssignments() {
  return assignments.filter((a) => a.status === 'pending' || a.status === 'overdue')
}

export function getUpcomingQuizzes() {
  return quizzes.filter((q) => q.status === 'upcoming')
}

export function getCompletedQuizzes() {
  return quizzes.filter((q) => q.status === 'completed')
}

/* ── Calendar ── */

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

export const studentCalendarEvents: StudentCalendarEvent[] = [
  { id: 'ce1', title: '1:1 Coaching — AWS Exam Strategy', date: '2026-06-26', time: '3:00 PM', type: 'coaching', courseTitle: 'AWS Solutions Architect', location: 'Microsoft Teams' },
  { id: 'ce2', title: 'VPC Architecture Lab Due', date: '2026-06-27', time: '11:59 PM', type: 'deadline', courseTitle: 'AWS Solutions Architect' },
  { id: 'ce3', title: 'Practice Exam Review — Live', date: '2026-06-28', time: '11:00 AM', type: 'live', courseTitle: 'AWS Solutions Architect', location: 'Zoom' },
  { id: 'ce4', title: 'AWS SAA Practice Exam — Set 2', date: '2026-06-28', time: '2:00 PM', type: 'quiz', courseTitle: 'AWS Solutions Architect' },
  { id: 'ce5', title: 'Career Roadmap Check-in', date: '2026-06-30', time: '10:00 AM', type: 'coaching', location: 'Microsoft Teams' },
  { id: 'ce6', title: 'Module 4: VPC & Networking', date: '2026-06-27', time: 'Self-paced', type: 'module', courseTitle: 'AWS Solutions Architect' },
  { id: 'ce7', title: 'Batch Cohort Sync — AWS Jun 2026', date: '2026-06-29', time: '6:00 PM', type: 'batch', courseTitle: 'AWS Solutions Architect', location: 'Group session' },
  { id: 'ce8', title: 'Data Cleaning Lab Due', date: '2026-06-27', time: '11:59 PM', type: 'deadline', courseTitle: 'Data Analytics' },
]

/* ── Batches ── */

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

export const studentBatches: StudentBatch[] = [
  {
    id: 'b1',
    name: 'AWS SAA — June 2026 Cohort',
    courseId: 'aws-solutions-architect',
    courseTitle: 'AWS Solutions Architect Certification Prep',
    instructor: 'Aanya Mehta',
    coach: 'Aanya Mehta',
    startDate: 'Jun 1, 2026',
    endDate: 'Aug 15, 2026',
    status: 'active',
    schedule: 'Tue & Thu · 6:00–8:00 PM IST',
    studentsCount: 24,
    progress: 68,
    nextSession: 'Jun 29 · 6:00 PM — Cohort sync',
    batchmates: [
      { name: 'Ankit Verma', initials: 'AV' },
      { name: 'Neha Sharma', initials: 'NS' },
      { name: 'Rahul M.', initials: 'RM' },
      { name: 'Priya K.', initials: 'PK' },
    ],
  },
  {
    id: 'b2',
    name: 'IT PM — May 2026 Batch',
    courseId: 'it-project-management',
    courseTitle: 'IT Project Management Professional',
    instructor: 'Rohan Kapoor',
    coach: 'Rohan Kapoor',
    startDate: 'May 12, 2026',
    endDate: 'Jul 24, 2026',
    status: 'active',
    schedule: 'Wed · 7:00–9:00 PM IST',
    studentsCount: 18,
    progress: 34,
    nextSession: 'Jul 2 · 7:00 PM — Stakeholder workshop',
    batchmates: [
      { name: 'Riya Patel', initials: 'RP' },
      { name: 'Sneha D.', initials: 'SD' },
      { name: 'Vikram S.', initials: 'VS' },
    ],
  },
  {
    id: 'b3',
    name: 'Data Analytics — Aug 2026 Intake',
    courseId: 'data-analytics-pro',
    courseTitle: 'Data Analytics Foundations',
    instructor: 'Aanya Mehta',
    coach: 'Aanya Mehta',
    startDate: 'Aug 4, 2026',
    endDate: 'Oct 12, 2026',
    status: 'upcoming',
    schedule: 'Mon & Fri · 6:30–8:00 PM IST',
    studentsCount: 12,
    progress: 0,
    nextSession: 'Orientation · Aug 4 · 6:30 PM',
    batchmates: [],
  },
]

/* ── Coaching sessions ── */

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

export const studentCoachingSessions: StudentCoachingSession[] = [
  { id: 'cs1', title: 'AWS Exam Strategy — 1:1', coach: 'Aanya Mehta', courseTitle: 'AWS Solutions Architect', date: 'Jun 26, 2026', time: '3:00 PM', duration: '60 min', type: '1:1', status: 'upcoming', meetingLink: 'https://teams.microsoft.com/l/meetup-join/aws-session', notes: 'Bring your practice exam results' },
  { id: 'cs2', title: 'Career Roadmap Check-in', coach: 'Career coach', date: 'Jun 30, 2026', time: '10:00 AM', duration: '45 min', type: '1:1', status: 'upcoming', meetingLink: 'https://teams.microsoft.com/l/meetup-join/career-checkin' },
  { id: 'cs3', title: 'Practice Exam Review — Live', coach: 'Aanya Mehta', courseTitle: 'AWS Solutions Architect', date: 'Jun 28, 2026', time: '11:00 AM', duration: '90 min', type: 'group', status: 'upcoming', meetingLink: 'https://zoom.us/j/practice-exam-review' },
  { id: 'cs4', title: 'Weekly Office Hours', coach: 'Aanya Mehta', date: 'Jul 3, 2026', time: '10:00 AM', duration: '90 min', type: 'office-hours', status: 'upcoming', meetingLink: 'https://teams.microsoft.com/l/meetup-join/office-hours' },
  { id: 'cs5', title: 'Project Management Q&A', coach: 'Rohan Kapoor', courseTitle: 'IT Project Management', date: 'Jun 18, 2026', time: '2:00 PM', duration: '45 min', type: '1:1', status: 'completed', meetingLink: '#' },
]

/* ── Messages ── */

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

export const studentMessages: StudentMessage[] = [
  { id: 'sm1', from: 'Aanya Mehta', role: 'Instructor & Coach', subject: 'VPC lab feedback', preview: 'Great work on the subnet design. One suggestion on the NAT gateway…', body: 'Great work on the subnet design. One suggestion on the NAT gateway configuration — consider using a single NAT in dev environments to reduce cost. Let me know if you want to walk through this in our next session.', time: '2 hours ago', read: false, courseTitle: 'AWS Solutions Architect' },
  { id: 'sm2', from: 'Rohan Kapoor', role: 'Instructor', subject: 'Stakeholder plan extension approved', preview: 'Your 2-day extension has been approved. New due date is Jul 2…', body: 'Your 2-day extension has been approved. New due date is Jul 2. Please focus on the risk register section — that is where most learners need extra coaching support.', time: 'Yesterday', read: false, courseTitle: 'IT Project Management' },
  { id: 'sm3', from: 'Platform Support', role: 'Support', subject: 'Certificate verification link', preview: 'Your Career Discovery certificate is now available for sharing…', body: 'Your Career Discovery certificate is now available for sharing on LinkedIn. Visit your Certificates page to download the PDF or copy the verification link.', time: '3 days ago', read: true },
  { id: 'sm4', from: 'Aanya Mehta', role: 'Instructor & Coach', subject: 'Practice exam results', preview: 'You scored 78% on Set 1 — strong on compute, review networking…', body: 'You scored 78% on Set 1 — strong on compute, review networking and security sections before Set 2. I have added recommended readings to Module 4.', time: '1 week ago', read: true, courseTitle: 'AWS Solutions Architect' },
]

export const unreadStudentMessages = studentMessages.filter((m) => !m.read).length
