import type { UserRole } from '../contexts/AuthContext'
import {
  studentNavSections,
  instructorNavSections,
  type NavSection,
} from '../data/dashboardData'
import type { StudentWorkspace } from './studentWorkspace'
import type { InstructorWorkspace } from './instructorWorkspace'

function withBadges(sections: NavSection[], badges: Partial<Record<string, string>>): NavSection[] {
  return sections.map((section) => ({
    ...section,
    items: section.items.map((item) => {
      const badge = badges[item.href]
      if (!badge) return item
      return { ...item, badge }
    }),
  }))
}

export function buildStudentNav(workspace: StudentWorkspace | null): NavSection[] {
  if (!workspace) return studentNavSections

  const badges: Partial<Record<string, string>> = {
    '/dashboard/courses': String(workspace.summary.activeCourses),
    '/dashboard/assignments': workspace.pendingAssignments > 0 ? String(workspace.pendingAssignments) : undefined,
    '/dashboard/notifications': workspace.unreadNotifications > 0 ? String(workspace.unreadNotifications) : undefined,
  }

  return withBadges(studentNavSections, badges)
}

export function buildInstructorNav(workspace: InstructorWorkspace | null): NavSection[] {
  if (!workspace) return instructorNavSections

  const { summary, unreadNotifications } = workspace

  const badges: Partial<Record<string, string>> = {
    '/instructor/courses': String(summary.coursesCreated),
    '/instructor/students': String(summary.totalStudents),
    '/instructor/notifications': unreadNotifications > 0 ? String(unreadNotifications) : undefined,
  }

  return withBadges(instructorNavSections, badges)
}

export function getDashboardNavForRole(
  role: UserRole,
  studentWorkspace: StudentWorkspace | null,
  instructorWorkspace: InstructorWorkspace | null,
): NavSection[] {
  return role === 'instructor'
    ? buildInstructorNav(instructorWorkspace)
    : buildStudentNav(studentWorkspace)
}
