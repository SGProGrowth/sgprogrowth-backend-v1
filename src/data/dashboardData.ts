import type { UserRole } from '../contexts/AuthContext'

export interface NavSection {
  title?: string
  items: NavItem[]
}

export interface NavItem {
  label: string
  href: string
  icon: NavIcon
  badge?: string
  description?: string
}

export type NavIcon =
  | 'home'
  | 'courses'
  | 'coaching'
  | 'roadmap'
  | 'certifications'
  | 'schedule'
  | 'messages'
  | 'certificates'
  | 'students'
  | 'analytics'
  | 'reviews'
  | 'calendar'
  | 'earnings'
  | 'content'
  | 'settings'
  | 'catalog'
  | 'progress'
  | 'assignments'
  | 'quizzes'
  | 'notifications'
  | 'profile'
  | 'grades'
  | 'announcements'

export const studentNavSections: NavSection[] = [
  {
    items: [
      { label: 'Overview', href: '/dashboard', icon: 'home', description: 'Your learning at a glance' },
      { label: 'My Courses', href: '/dashboard/courses', icon: 'courses', badge: '3', description: 'Active enrollments' },
      { label: 'Learning Progress', href: '/dashboard/progress', icon: 'progress', description: 'Milestones & completion' },
      { label: 'Assignments', href: '/dashboard/assignments', icon: 'assignments', badge: '3', description: 'Submissions & deadlines' },
    ],
  },
  {
    title: 'Assess',
    items: [
      { label: 'Quizzes & Assessments', href: '/dashboard/quizzes', icon: 'quizzes', description: 'Tests & performance' },
      { label: 'Certificates', href: '/dashboard/certificates', icon: 'certificates', description: 'Earned credentials' },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Notifications', href: '/dashboard/notifications', icon: 'notifications', badge: '3', description: 'Updates & alerts' },
      { label: 'Browse Catalog', href: '/courses', icon: 'catalog', description: 'Explore all programs' },
      { label: 'Profile & Settings', href: '/dashboard/settings', icon: 'profile', description: 'Account preferences' },
    ],
  },
]

export const instructorNavSections: NavSection[] = [
  {
    items: [
      { label: 'Overview', href: '/instructor', icon: 'home', description: 'Teaching dashboard' },
      { label: 'My Courses', href: '/instructor/courses', icon: 'courses', badge: '4', description: 'Manage programs' },
      { label: 'Students', href: '/instructor/students', icon: 'students', badge: '128', description: 'Enrollments & progress' },
      { label: 'Live Sessions', href: '/instructor/coaching', icon: 'coaching', badge: '6', description: 'Coaching schedule' },
    ],
  },
  {
    title: 'Teaching',
    items: [
      { label: 'Grade Management', href: '/instructor/grades', icon: 'grades', badge: '8', description: 'Review submissions' },
      { label: 'Announcements', href: '/instructor/announcements', icon: 'announcements', description: 'Course communications' },
      { label: 'Messages', href: '/instructor/messages', icon: 'messages', badge: '2', description: 'Student inbox' },
    ],
  },
  {
    title: 'Insights',
    items: [
      { label: 'Analytics', href: '/instructor/analytics', icon: 'analytics', description: 'Performance insights' },
      { label: 'Calendar', href: '/instructor/calendar', icon: 'calendar', description: 'Events & deadlines' },
      { label: 'Notifications', href: '/instructor/notifications', icon: 'notifications', badge: '3', description: 'Platform alerts' },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Profile', href: '/instructor/profile', icon: 'profile', description: 'Public instructor profile' },
      { label: 'Settings', href: '/instructor/settings', icon: 'settings', description: 'Account & payout' },
    ],
  },
]

export function getDashboardNav(role: UserRole): NavSection[] {
  return role === 'instructor' ? instructorNavSections : studentNavSections
}

export function getDashboardBasePath(role: UserRole): string {
  return role === 'instructor' ? '/instructor' : '/dashboard'
}

/* ── Student mock data ── */

export const studentStats = [
  { label: 'Active programs', value: '3', change: '+1 this month', trend: 'up' as const },
  { label: 'Learning hours', value: '42h', change: '8h this week', trend: 'up' as const },
  { label: 'Coaching sessions', value: '2', change: 'Next: Tomorrow', trend: 'neutral' as const },
  { label: 'Cert progress', value: '68%', change: 'AWS SAA track', trend: 'up' as const },
]

export const studentActivePrograms = [
  {
    id: 'aws-saa',
    title: 'AWS Solutions Architect',
    coach: 'Mahesh M.',
    progress: 68,
    week: 'Week 6 of 10',
    nextUp: 'Module 4: VPC & Networking',
    dueDate: 'Due Friday',
  },
  {
    id: 'it-pm',
    title: 'IT Project Management',
    coach: 'Kanchi Shah',
    progress: 34,
    week: 'Week 3 of 12',
    nextUp: 'Stakeholder management workshop',
    dueDate: 'Due next week',
  },
  {
    id: 'data-analytics',
    title: 'Data Analytics Foundations',
    coach: 'Mahesh M.',
    progress: 12,
    week: 'Week 1 of 8',
    nextUp: 'Orientation & goal setting',
    dueDate: 'Today',
  },
]

export const studentUpcoming = [
  { label: '1:1 Coaching session', meta: 'Tomorrow · 3:00 PM', type: 'live' as const, with: 'Mahesh M.' },
  { label: 'Module 4: VPC & Networking', meta: 'Self-paced · 2 hrs', type: 'module' as const, with: 'AWS SAA' },
  { label: 'Practice exam review', meta: 'Friday · 11:00 AM', type: 'live' as const, with: 'Mahesh M.' },
  { label: 'Career roadmap check-in', meta: 'Mon · 10:00 AM', type: 'coaching' as const, with: 'Career coach' },
]

export const studentCoachingSessions = [
  { id: '1', title: 'AWS exam strategy', coach: 'Mahesh M.', date: 'Jun 26, 2026', time: '3:00 PM', status: 'upcoming' as const },
  { id: '2', title: 'Career roadmap review', coach: 'Career coach', date: 'Jun 30, 2026', time: '10:00 AM', status: 'upcoming' as const },
  { id: '3', title: 'Project management Q&A', coach: 'Kanchi Shah', date: 'Jun 18, 2026', time: '2:00 PM', status: 'completed' as const },
]

export const studentRoadmapMilestones = [
  { phase: 'Foundation', title: 'Assess skills & goals', status: 'completed' as const, date: 'May 2026' },
  { phase: 'Core skills', title: 'AWS Solutions Architect prep', status: 'in-progress' as const, date: 'Jun–Aug 2026' },
  { phase: 'Certification', title: 'AWS SAA exam', status: 'upcoming' as const, date: 'Sep 2026' },
  { phase: 'Career', title: 'Interview prep & placement', status: 'upcoming' as const, date: 'Oct 2026' },
]

/* ── Instructor mock data ── */

export const instructorStats = [
  { label: 'Total students', value: '128', change: '+12 this month', trend: 'up' as const },
  { label: 'Active courses', value: '4', change: '2 enrolling now', trend: 'neutral' as const },
  { label: 'Avg. completion', value: '78%', change: '+5% vs last quarter', trend: 'up' as const },
  { label: 'Coaching sessions', value: '6', change: 'This week', trend: 'neutral' as const },
]

export const instructorCourses = [
  { id: 'aws-saa', title: 'AWS Solutions Architect', students: 45, completion: 72, rating: 4.8, revenue: '₹4,860', status: 'published' as const },
  { id: 'it-pm', title: 'IT Project Management', students: 38, completion: 65, rating: 4.6, revenue: '₹4,104', status: 'published' as const },
  { id: 'bni-coaches', title: 'BNI Trainers & Coaches', students: 22, completion: 81, rating: 4.9, revenue: 'Private', status: 'published' as const },
  { id: 'demo', title: 'Demo Course', students: 23, completion: 45, rating: 4.2, revenue: 'Apply to enroll', status: 'draft' as const },
]

export const instructorRecentActivity = [
  { type: 'enrollment' as const, text: 'Riya enrolled in IT Project Management', time: '2 hours ago' },
  { type: 'review' as const, text: 'New 5-star review on AWS Solutions Architect', time: '5 hours ago' },
  { type: 'session' as const, text: 'Coaching session completed with Ankit', time: 'Yesterday' },
  { type: 'completion' as const, text: 'Neha completed Module 3 — VPC basics', time: 'Yesterday' },
]

export const instructorUpcomingSessions = [
  { student: 'Neha Sharma', topic: 'AWS exam strategy', date: 'Jun 26', time: '3:00 PM' },
  { student: 'Ankit Verma', topic: 'Cloud career roadmap', date: 'Jun 27', time: '11:00 AM' },
  { student: 'Riya Patel', topic: 'PM certification prep', date: 'Jun 28', time: '2:00 PM' },
]

export const instructorTopStudents = [
  { name: 'Neha Sharma', program: 'AWS Solutions Architect', progress: 68, lastActive: 'Today' },
  { name: 'Ankit Verma', program: 'AWS Solutions Architect', progress: 82, lastActive: 'Today' },
  { name: 'Riya Patel', program: 'IT Project Management', progress: 54, lastActive: 'Yesterday' },
  { name: 'Priya K.', program: 'Data Analytics', progress: 41, lastActive: '2 days ago' },
]
