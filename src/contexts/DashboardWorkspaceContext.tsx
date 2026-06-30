import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { UserRole } from './AuthContext'
import { useAuth } from './AuthContext'
import { getStudentWorkspace, type StudentWorkspace } from '../lib/studentWorkspace'
import { getInstructorWorkspace, type InstructorWorkspace } from '../lib/instructorWorkspace'
import { fetchInstructorWorkspace, fetchStudentWorkspace } from '../lib/api/workspace'
import { LoadingState } from '../components/ui/LoadingState'
import { Button } from '../components/ui/Button'

type DashboardWorkspace = StudentWorkspace | InstructorWorkspace

const USE_MOCK_WORKSPACE = import.meta.env.VITE_USE_MOCK_WORKSPACE === 'true'

interface DashboardWorkspaceContextValue {
  role: UserRole
  workspace: DashboardWorkspace
  unreadNotifications: number
  isLoading: boolean
  error: string | null
  refresh: () => void
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
  const [workspace, setWorkspace] = useState<DashboardWorkspace | null>(null)
  const [isLoading, setIsLoading] = useState(!USE_MOCK_WORKSPACE)
  const [error, setError] = useState<string | null>(null)
  const [fetchKey, setFetchKey] = useState(0)

  const refresh = useCallback(() => setFetchKey((k) => k + 1), [])

  useEffect(() => {
    if (!user || user.role !== role) {
      setWorkspace(null)
      setIsLoading(false)
      setError(null)
      return
    }

    if (USE_MOCK_WORKSPACE) {
      const mock =
        role === 'student'
          ? getStudentWorkspace(user.id, user.email, user.name, user.avatarInitials)
          : getInstructorWorkspace(user.id, user.email, user.name, user.avatarInitials)
      setWorkspace(mock)
      setIsLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    const load = role === 'student' ? fetchStudentWorkspace : fetchInstructorWorkspace

    load()
      .then((data) => {
        if (!cancelled) {
          setWorkspace(data)
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setWorkspace(null)
          setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user?.id, user?.email, user?.name, user?.avatarInitials, user?.role, role, fetchKey])

  if (!user || user.role !== role) return null

  if (isLoading) {
    return <LoadingState label="Loading your dashboard…" className="min-h-screen" />
  }

  if (error || !workspace) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-stone-100/80 px-4 text-center">
        <p className="max-w-md text-stone-700">
          {error ?? 'Unable to load dashboard data. Check that the API is running and try again.'}
        </p>
        <Button type="button" onClick={refresh}>
          Retry
        </Button>
      </div>
    )
  }

  const value: DashboardWorkspaceContextValue = {
    role,
    workspace,
    unreadNotifications: workspace.notifications.filter((n) => !n.read).length,
    isLoading: false,
    error: null,
    refresh,
  }

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
  const { workspace, isLoading, error, refresh } = useDashboardWorkspaceContext()
  const studentWorkspace = workspace as StudentWorkspace

  return {
    user,
    workspace: studentWorkspace,
    profile: studentWorkspace.profile,
    isReady: !isLoading && !error,
    isLoading,
    error,
    refresh,
  }
}

export function useInstructorDashboard() {
  const { user } = useAuth()
  const { workspace, isLoading, error, refresh } = useDashboardWorkspaceContext()
  const instructorWorkspace = workspace as InstructorWorkspace

  return {
    user,
    workspace: instructorWorkspace,
    profile: instructorWorkspace.profile,
    isReady: !isLoading && !error,
    isLoading,
    error,
    refresh,
  }
}

export function useDashboardNotifications() {
  return useDashboardWorkspaceContext().unreadNotifications
}
