import { Navigate, useLocation } from 'react-router-dom'
import { useAuth, type UserRole } from '../contexts/AuthContext'
import { getDashboardBasePath } from '../data/dashboardData'
import { LoadingState } from '../components/ui/LoadingState'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: UserRole
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100/80">
        <LoadingState label="Loading your session…" />
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={getDashboardBasePath(user.role)} replace />
  }

  return <>{children}</>
}

export function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <LoadingState label="Loading…" />
      </div>
    )
  }

  if (isAuthenticated && user) {
    return <Navigate to={getDashboardBasePath(user.role)} replace />
  }

  return <>{children}</>
}
