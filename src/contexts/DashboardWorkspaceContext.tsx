import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { UserRole } from './AuthContext'
import { useAuth } from './AuthContext'
import { getStudentWorkspace, type StudentWorkspace } from '../lib/studentWorkspace'
import { getInstructorWorkspace, type InstructorWorkspace } from '../lib/instructorWorkspace'

type DashboardWorkspace = StudentWorkspace | InstructorWorkspace

interface DashboardWorkspaceContextValue {
  role: UserRole
  workspace: DashboardWorkspace
  unreadNotifications: number
}

const DashboardWorkspaceContext = createContext<DashboardWorkspaceContextValue | null>(null)

export function DashboardWorkspaceProvider({
  role,
  children,
}: {
  role: UserRole
  children: ReactNode
}) {
  const { user } = useAuth()

  const value = useMemo((): DashboardWorkspaceContextValue | null => {
    if (!user || user.role !== role) return null

    const workspace =
      role === 'student'
        ? getStudentWorkspace(user.id, user.email, user.name, user.avatarInitials)
        : getInstructorWorkspace(user.id, user.email, user.name, user.avatarInitials)

    return {
      role,
      workspace,
      unreadNotifications: workspace.notifications.filter((n) => !n.read).length,
    }
  }, [user?.id, user?.email, user?.name, user?.avatarInitials, user?.role, role])

  if (!value) return null

  return (
    <DashboardWorkspaceContext.Provider value={value}>
      {children}
    </DashboardWorkspaceContext.Provider>
  )
}

export function useDashboardWorkspaceContext() {
  const ctx = useContext(DashboardWorkspaceContext)
  if (!ctx) {
    throw new Error('Dashboard workspace hooks must be used within DashboardWorkspaceProvider')
  }
  return ctx
}

export function useStudentDashboard() {
  const { user } = useAuth()
  const { workspace } = useDashboardWorkspaceContext()
  const studentWorkspace = workspace as StudentWorkspace

  return {
    user,
    workspace: studentWorkspace,
    profile: studentWorkspace.profile,
    isReady: true,
  }
}

export function useInstructorDashboard() {
  const { user } = useAuth()
  const { workspace } = useDashboardWorkspaceContext()
  const instructorWorkspace = workspace as InstructorWorkspace

  return {
    user,
    workspace: instructorWorkspace,
    profile: instructorWorkspace.profile,
    isReady: true,
  }
}

export function useDashboardNotifications() {
  return useDashboardWorkspaceContext().unreadNotifications
}
