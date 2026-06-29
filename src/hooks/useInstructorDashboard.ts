import { useMemo } from 'react'
import {
  useInstructorDashboard as useInstructorDashboardContext,
} from '../contexts/DashboardWorkspaceContext'

export { useInstructorDashboard } from '../contexts/DashboardWorkspaceContext'

export function useInstructorCourse(courseId: string | undefined) {
  const { workspace } = useInstructorDashboardContext()

  return useMemo(
    () => (courseId ? workspace.courses.find((c) => c.id === courseId) : undefined),
    [courseId, workspace.courses],
  )
}
