import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth, type UserRole } from '../../contexts/AuthContext'
import { type NavSection } from '../../data/dashboardData'
import { buildInstructorNav, buildStudentNav } from '../../lib/dashboardNav'
import {
  useDashboardNotifications,
  useDashboardWorkspaceContext,
} from '../../contexts/DashboardWorkspaceContext'
import type { InstructorWorkspace } from '../../lib/instructorWorkspace'
import type { StudentWorkspace } from '../../lib/studentWorkspace'
import { NavIconSvg } from './NavIcon'

interface DashboardSidebarProps {
  role: UserRole
  open: boolean
  onClose: () => void
}

function SidebarNav({ sections, onNavigate }: { sections: NavSection[]; onNavigate?: () => void }) {
  const location = useLocation()

  const isActive = (href: string) => {
    if (href === '/dashboard' || href === '/instructor') {
      return location.pathname === href
    }
    return location.pathname.startsWith(href)
  }

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4">
      {sections.map((section, idx) => (
        <div key={section.title ?? idx} className={idx > 0 ? 'mt-6' : ''}>
          {section.title && (
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-4">
              {section.title}
            </p>
          )}
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const active = isActive(item.href)
              const isExternal = item.href.startsWith('/courses')

              const linkClass = `group flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-forest-800 text-white'
                  : 'text-ink-2 hover:bg-stone-100 hover:text-ink'
              }`

              const content = (
                <>
                  <NavIconSvg
                    icon={item.icon}
                    className={`h-[18px] w-[18px] shrink-0 ${active ? 'text-white' : 'text-ink-3 group-hover:text-ink-2'}`}
                  />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                        active ? 'bg-white/20 text-white' : 'bg-stone-200 text-ink-2'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )

              return (
                <li key={item.href}>
                  {isExternal ? (
                    <a href={item.href} className={linkClass} onClick={onNavigate}>
                      {content}
                    </a>
                  ) : (
                    <NavLink to={item.href} className={linkClass} onClick={onNavigate}>
                      {content}
                    </NavLink>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

export function DashboardSidebar({ role, open, onClose }: DashboardSidebarProps) {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { workspace } = useDashboardWorkspaceContext()
  const sections = role === 'instructor'
    ? buildInstructorNav(workspace as InstructorWorkspace)
    : buildStudentNav(workspace as StudentWorkspace)
  const basePath = role === 'instructor' ? '/instructor' : '/dashboard'

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  return (
    <>
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-ink/40 lg:hidden"
          aria-label="Close sidebar"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(280px,88vw)] flex-col border-r border-stone-200 bg-white transition-transform duration-200 lg:static lg:w-[260px] lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between gap-2 border-b border-stone-200 px-4 sm:px-5">
          <Link to={basePath} className="flex min-w-0 items-center gap-2.5" onClick={onClose}>
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-forest-800">
              <span className="text-sm font-bold text-white tracking-tight">SG</span>
            </div>
            <div className="leading-none">
              <span className="block font-display text-[14px] font-bold text-ink">SG Pro Growth</span>
              <span className="block text-[10px] font-medium text-ink-3 mt-0.5 capitalize">
                {role} portal
              </span>
            </div>
          </Link>
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-ink-3 hover:bg-stone-100 lg:hidden"
            aria-label="Close menu"
            onClick={onClose}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <SidebarNav sections={sections} onNavigate={onClose} />

        <div className="border-t border-stone-200 p-4">
          <div className="flex items-center gap-3 rounded-md px-2 py-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest-100 text-sm font-semibold text-forest-800">
              {user?.avatarInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{user?.name}</p>
              <p className="truncate text-xs text-ink-3">{user?.email}</p>
            </div>
          </div>
          <div className="mt-2 flex gap-2">
            <Link
              to="/"
              className="flex-1 rounded-md border border-stone-200 px-3 py-2 text-center text-xs font-semibold text-ink-2 hover:bg-stone-50"
              onClick={onClose}
            >
              Home
            </Link>
            <button
              type="button"
              onClick={() => {
                void signOut().then(() => {
                  onClose()
                  navigate('/login', { replace: true })
                })
              }}
              className="flex-1 rounded-md border border-stone-200 px-3 py-2 text-xs font-semibold text-ink-2 hover:bg-stone-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

export function DashboardHeader({
  title,
  subtitle,
  onMenuClick,
  showNotifications = false,
  notificationsPath = '/dashboard/notifications',
  settingsPath = '/dashboard/settings',
}: {
  title: string
  subtitle?: string
  onMenuClick: () => void
  showNotifications?: boolean
  notificationsPath?: string
  settingsPath?: string
}) {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const unreadNotifications = useDashboardNotifications()
  const [showUserMenu, setShowUserMenu] = useState(false)

  useEffect(() => {
    if (!showUserMenu) return
    const close = () => setShowUserMenu(false)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [showUserMenu])

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur-sm">
      <div className="flex h-14 min-h-14 items-center gap-2 px-3 sm:h-16 sm:gap-4 sm:px-4 md:px-6 lg:px-8">
        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-ink-2 hover:bg-stone-100 lg:hidden"
          aria-label="Open menu"
          onClick={onMenuClick}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-base font-bold text-ink sm:text-lg md:text-xl">{title}</p>
          {subtitle && <p className="hidden truncate text-sm text-ink-3 sm:block">{subtitle}</p>}
        </div>

        <div className="hidden md:block flex-1 max-w-sm">
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              placeholder="Search..."
              className="input-field w-full pl-9 h-10 text-sm"
            />
          </div>
        </div>

        <Link
          to={notificationsPath}
          className="relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-ink-2 hover:bg-stone-100"
          aria-label="Notifications"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
          {showNotifications && (() => {
            const count = unreadNotifications
            return count > 0 ? (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold-500 text-[9px] font-bold text-white">
                {count}
              </span>
            ) : null
          })()}
        </Link>

        <div className="relative">
          <button
            type="button"
            className="flex min-h-11 items-center gap-2 rounded-md p-1.5 hover:bg-stone-100"
            onClick={(e) => {
              e.stopPropagation()
              setShowUserMenu((v) => !v)
            }}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-forest-100 text-xs font-semibold text-forest-800">
              {user?.avatarInitials}
            </div>
          </button>
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 rounded-md border border-stone-200 bg-white py-1 shadow-lg">
              <div className="border-b border-stone-100 px-4 py-2">
                <p className="text-sm font-semibold text-ink">{user?.name}</p>
                <p className="text-xs text-ink-3 capitalize">{user?.role}</p>
              </div>
              <Link to={settingsPath} className="block px-4 py-2 text-sm text-ink-2 hover:bg-stone-50">
                Profile & settings
              </Link>
              <Link to="/" className="block px-4 py-2 text-sm text-ink-2 hover:bg-stone-50">
                Back to homepage
              </Link>
              <button
                type="button"
                className="block w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50"
                onClick={() => {
                  void signOut().then(() => {
                    setShowUserMenu(false)
                    navigate('/login', { replace: true })
                  })
                }}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
