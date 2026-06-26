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
    instructor: 'Cloud Academy · Sharva Group',
    coach: 'Mahesh M.',
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
    instructor: 'Mahesh M. · Sharva Group',
    coach: 'Kanchi Shah',
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
    instructor: 'Data Labs · Sharva Group',
    coach: 'Mahesh M.',
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
    instructor: 'Kanchi Shah · Sharva Group',
    coach: 'Kanchi Shah',
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
    instructor: 'Kanchi Shah',
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
    message: 'Your 1:1 with Mahesh M. on AWS exam strategy is scheduled for 3:00 PM.',
    time: '5 hours ago',
    read: false,
    actionLabel: 'View schedule',
    actionHref: '/dashboard',
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
    subtitle: 'AWS exam strategy · with Mahesh M.',
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
    subtitle: 'Live review · with Mahesh M.',
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
