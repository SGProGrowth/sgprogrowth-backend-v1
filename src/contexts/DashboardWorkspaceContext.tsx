import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { UserRole } from './AuthContext'
import { useAuth } from './AuthContext'
import type { StudentWorkspace } from '../lib/studentWorkspace'
import type { InstructorWorkspace } from '../lib/instructorWorkspace'
import { fetchInstructorWorkspace, fetchStudentWorkspace } from '../lib/api/workspace'
import {
  getCachedWorkspace,
  setCachedWorkspace,
  workspaceCacheKey,
} from '../lib/workspaceCache'
import { LoadingState } from '../components/ui/LoadingState'
import { Button } from '../components/ui/Button'
import { AlertBanner } from '../components/ui/AlertBanner'
import { isRequestAborted } from '../lib/api/client'
import { getFriendlyErrorMessage } from '../lib/api/errors'

type DashboardWorkspace = StudentWorkspace | InstructorWorkspace

interface DashboardWorkspaceContextValue {
  role: UserRole
  workspace: DashboardWorkspace
  unreadNotifications: number
  isLoading: boolean
  isRefreshing: boolean
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
  const cacheKey = user ? workspaceCacheKey(role, user.id) : ''
  const cached = cacheKey ? getCachedWorkspace<DashboardWorkspace>(cacheKey) : undefined

  const [workspace, setWorkspace] = useState<DashboardWorkspace | null>(() => cached ?? null)
  const [isLoading, setIsLoading] = useState(!cached)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fetchKey, setFetchKey] = useState(0)

  const refresh = useCallback(() => setFetchKey((k) => k + 1), [])

  useEffect(() => {
    if (!user || user.role !== role || !cacheKey) {
      setWorkspace(null)
      setIsLoading(false)
      setIsRefreshing(false)
      setError(null)
      return
    }

    let cancelled = false
    const controller = new AbortController()
    const hasCached = Boolean(getCachedWorkspace(cacheKey))
    if (!hasCached) {
      setIsLoading(true)
    } else {
      setIsRefreshing(true)
    }
    setError(null)

    const load = role === 'student' ? fetchStudentWorkspace : fetchInstructorWorkspace

    load(controller.signal)
      .then((data) => {
        if (!cancelled) {
          setCachedWorkspace(cacheKey, data)
          setWorkspace(data)
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (cancelled || isRequestAborted(err)) return
        if (!getCachedWorkspace(cacheKey)) {
          setWorkspace(null)
        }
        setError(getFriendlyErrorMessage(err, 'Failed to load dashboard data'))
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
          setIsRefreshing(false)
        }
      })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [user?.id, user?.role, role, fetchKey, cacheKey])

  const unreadNotifications = useMemo(
    () => workspace?.notifications.filter((n) => !n.read).length ?? 0,
    [workspace?.notifications],
  )

  const value = useMemo<DashboardWorkspaceContextValue | null>(() => {
    if (!workspace) return null
    return {
      role,
      workspace,
      unreadNotifications,
      isLoading: false,
      isRefreshing,
      error,
      refresh,
    }
  }, [role, workspace, unreadNotifications, isRefreshing, error, refresh])

  if (!user || user.role !== role) return null

  if (isLoading && !workspace) {
    return <LoadingState label="Loading your dashboard…" className="min-h-screen" />
  }

  if ((error && !workspace) || !value) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-stone-100/80 px-4 py-12 text-center">
        <div className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-8 shadow-[0_1px_2px_rgba(10,10,10,0.04)]">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="font-display text-lg font-bold text-ink">Unable to load dashboard</h1>
          <AlertBanner variant="error" className="mt-4 text-left">
            {error ?? 'Check that the API is running and try again.'}
          </AlertBanner>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button type="button" onClick={refresh}>Retry</Button>
            <Button type="button" variant="secondary" onClick={() => window.location.assign('/')}>
              Back to homepage
            </Button>
          </div>
        </div>
      </div>
    )
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
  const { workspace, isLoading, isRefreshing, error, refresh } = useDashboardWorkspaceContext()

  return useMemo(
    () => ({
      user,
      workspace: workspace as StudentWorkspace,
      profile: (workspace as StudentWorkspace).profile,
      isReady: !isLoading && !error,
      isLoading,
      isRefreshing,
      error,
      refresh,
    }),
    [user, workspace, isLoading, isRefreshing, error, refresh],
  )
}

export function useInstructorDashboard() {
  const { user } = useAuth()
  const { workspace, isLoading, isRefreshing, error, refresh } = useDashboardWorkspaceContext()

  return useMemo(
    () => ({
      user,
      workspace: workspace as InstructorWorkspace,
      profile: (workspace as InstructorWorkspace).profile,
      isReady: !isLoading && !error,
      isLoading,
      isRefreshing,
      error,
      refresh,
    }),
    [user, workspace, isLoading, isRefreshing, error, refresh],
  )
}

export function useDashboardNotifications() {
  return useDashboardWorkspaceContext().unreadNotifications
}
