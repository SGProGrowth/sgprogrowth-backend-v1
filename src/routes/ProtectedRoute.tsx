import { Navigate, useLocation } from 'react-router-dom'
import { useAuth, type UserRole } from '../contexts/AuthContext'
import { getDashboardBasePath } from '../data/dashboardData'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: UserRole
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={getDashboardBasePath(user.role)} replace />
  }

  return <>{children}</>
}

export function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth()

  if (isAuthenticated && user) {
    return <Navigate to={getDashboardBasePath(user.role)} replace />
  }

  return <>{children}</>
}
