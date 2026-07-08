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
  | 'batches'
  | 'question-bank'
  | 'import'

export const studentNavSections: NavSection[] = [
  {
    items: [
      { label: 'Overview', href: '/dashboard', icon: 'home', description: 'Your learning at a glance' },
      { label: 'My Courses', href: '/dashboard/courses', icon: 'courses', description: 'Active enrollments' },
      { label: 'Learning Progress', href: '/dashboard/progress', icon: 'progress', description: 'Milestones & completion' },
      { label: 'Assignments', href: '/dashboard/assignments', icon: 'assignments', description: 'Submissions & deadlines' },
      { label: 'Calendar', href: '/dashboard/calendar', icon: 'calendar', description: 'Sessions, deadlines & events' },
      { label: 'My Batches', href: '/dashboard/batches', icon: 'batches', description: 'Cohort schedules & classmates' },
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
      { label: 'Notifications', href: '/dashboard/notifications', icon: 'notifications', description: 'Updates & alerts' },
      { label: 'Browse Catalog', href: '/courses', icon: 'catalog', description: 'Explore all programs' },
      { label: 'Profile & Settings', href: '/dashboard/settings', icon: 'profile', description: 'Account preferences' },
    ],
  },
]

export const instructorNavSections: NavSection[] = [
  {
    items: [
      { label: 'Overview', href: '/instructor', icon: 'home', description: 'Teaching dashboard' },
      { label: 'My Courses', href: '/instructor/courses', icon: 'courses', description: 'Manage programs' },
      { label: 'Students', href: '/instructor/students', icon: 'students', description: 'Enrollments & progress' },
      { label: 'Batches', href: '/instructor/batches', icon: 'batches', description: 'Cohort & batch management' },
    ],
  },
  {
    title: 'Teaching',
    items: [
      { label: 'Assignments', href: '/instructor/assignments', icon: 'assignments', description: 'Create, manage & grade coursework' },
      { label: 'Quizzes', href: '/instructor/quizzes', icon: 'quizzes', description: 'Generic & course quizzes' },
      { label: 'Question Bank', href: '/instructor/question-bank', icon: 'question-bank', description: 'Reusable assessment items' },
      { label: 'Certificates', href: '/instructor/certificates', icon: 'certificates', description: 'Issue & manage credentials' },
    ],
  },
  {
    title: 'Insights',
    items: [
      { label: 'Analytics', href: '/instructor/analytics', icon: 'analytics', description: 'Performance insights' },
      { label: 'Calendar', href: '/instructor/calendar', icon: 'calendar', description: 'Events & deadlines' },
      { label: 'Notifications', href: '/instructor/notifications', icon: 'notifications', description: 'Platform alerts' },
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
