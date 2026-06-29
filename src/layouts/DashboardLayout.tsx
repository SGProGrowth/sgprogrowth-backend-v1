import { Suspense, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import type { UserRole } from '../contexts/AuthContext'
import { DashboardWorkspaceProvider } from '../contexts/DashboardWorkspaceContext'
import { studentPageMeta } from '../data/studentData'
import { instructorPageMeta } from '../data/instructorData'
import { DashboardHeader, DashboardSidebar } from '../components/dashboard/DashboardSidebar'
import { LoadingState } from '../components/ui/LoadingState'

function getPageMeta(pathname: string, role: UserRole) {
  const metaMap = role === 'student' ? studentPageMeta : instructorPageMeta
  const exact = metaMap[pathname]
  if (exact) return exact

  if (role === 'instructor') {
    if (pathname.includes('/courses/') && pathname.includes('/edit')) return { title: 'Edit Course', subtitle: 'Course builder' }
    if (pathname.includes('/courses/') && pathname.includes('/preview')) return { title: 'Course Preview', subtitle: 'Student view' }
    if (pathname.includes('/courses/new')) return instructorPageMeta['/instructor/courses/new']
    if (pathname.startsWith('/instructor/students/') && !pathname.includes('/import')) return { title: 'Student Progress', subtitle: 'Individual learner tracking' }
    if (pathname.includes('/students/import')) return instructorPageMeta['/instructor/students/import']
  }

  const match = Object.entries(metaMap).find(([path]) => path !== '/dashboard' && path !== '/instructor' && pathname.startsWith(path))
  if (match) return match[1]

  return role === 'student'
    ? { title: 'Dashboard', subtitle: 'Your learning at a glance' }
    : { title: 'Dashboard', subtitle: 'Teaching & coaching hub' }
}

export function DashboardLayout({ role }: { role: UserRole }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { pathname } = useLocation()
  const meta = getPageMeta(pathname, role)

  return (
    <DashboardWorkspaceProvider role={role}>
      <div className="flex min-h-screen overflow-x-hidden bg-stone-100/80">
        <a
          href="#dashboard-main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-forest-800 focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to main content
        </a>
        <DashboardSidebar role={role} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardHeader
            title={meta.title}
            subtitle={meta.subtitle}
            onMenuClick={() => setSidebarOpen(true)}
            showNotifications
            notificationsPath={role === 'student' ? '/dashboard/notifications' : '/instructor/notifications'}
            settingsPath={role === 'student' ? '/dashboard/settings' : '/instructor/settings'}
          />

          <main id="dashboard-main" className="flex-1 overflow-x-hidden overflow-y-auto">
            <div className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8 lg:px-8">
              <Suspense fallback={<LoadingState label="Loading page…" />}>
                <Outlet />
              </Suspense>
            </div>
          </main>
        </div>
      </div>
    </DashboardWorkspaceProvider>
  )
}
