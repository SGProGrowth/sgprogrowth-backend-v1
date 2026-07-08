import { useEffect, useMemo, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getGreeting } from '../../../lib/greeting'
import { useInstructorDashboard } from '../../../hooks/useInstructorDashboard'
import { PageIntro, Panel, StatTile, EmptyState } from '../../../components/dashboard/PageShell'
import { InstructorCourseRow } from '../../../components/instructor/CourseCard'
import { StatusBadge } from '../../../components/instructor/StatusBadge'
import { Button } from '../../../components/ui/Button'
import { Pagination, usePagination } from '../../../components/ui/Pagination'
import { LoadingState } from '../../../components/ui/LoadingState'
import { AlertBanner } from '../../../components/ui/AlertBanner'
import { getFriendlyErrorMessage } from '../../../lib/api/errors'
import { fetchMyInstructorCourses } from '../../../lib/api/courses'
import type { InstructorCourse } from '../../../data/instructorData'

export function InstructorOverviewPage() {
  const { user, workspace } = useInstructorDashboard()
  const firstName = user?.name.split(' ')[0] ?? 'there'
  const { summary } = workspace
  const recentCourses = workspace.courses.slice(0, 3)
  const upcomingSessions = workspace.liveSessions.filter((s) => s.status === 'scheduled').slice(0, 4)
  const recentNotifs = workspace.notifications.slice(0, 3)
  const hasCourses = workspace.courses.length > 0
  const enrollingNow = workspace.courses.filter((c) => c.status === 'published').length

  return (
    <div className="animate-rise space-y-8">
      <header className="rounded-2xl border border-stone-200 bg-white px-6 py-8 md:px-8 shadow-[0_1px_2px_rgba(10,10,10,0.04)]">
        <p className="text-label mb-2">Instructor dashboard</p>
        <h1 className="text-display-lg text-ink">{getGreeting()}, {firstName}</h1>
        <p className="mt-3 max-w-2xl text-body-lg">
          {hasCourses
            ? `${summary.sessionsThisWeek} coaching sessions this week · ${summary.pendingGrades} submissions awaiting review.`
            : 'Create your first course to start teaching and tracking student progress.'}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button to="/instructor/courses/new" variant="primary" size="md">Create new course</Button>
          <Button to="/instructor/assignments" variant="secondary" size="md">Review grades ({summary.pendingGrades})</Button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Total students" value={summary.totalStudents} hint={`+${summary.newEnrollments} this month`} />
        <StatTile label="Active courses" value={summary.activeCourses} hint={`${enrollingNow} published`} />
        <StatTile label="Avg. completion" value={`${summary.avgCompletion}%`} hint="Across published courses" />
        <StatTile label="Monthly revenue" value={summary.monthlyRevenue} hint="Before fees" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Panel title="Your courses" className="lg:col-span-3" action={<Link to="/instructor/courses" className="text-sm font-semibold text-forest-800 hover:text-forest-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600 focus-visible:ring-offset-2 rounded-md">Manage all</Link>}>
          {recentCourses.length > 0 ? (
            <div className="space-y-4">
              {recentCourses.map((c) => (
                <InstructorCourseRow key={c.id} course={c} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No courses yet"
              description="Create your first course to start teaching and tracking student progress."
              action={<Button to="/instructor/courses/new" variant="primary" size="sm">Create course</Button>}
            />
          )}
        </Panel>

        <Panel title="Upcoming sessions" className="lg:col-span-2" action={upcomingSessions.length > 0 ? <Link to="/instructor/calendar" className="text-sm font-semibold text-forest-800 hover:text-forest-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600 focus-visible:ring-offset-2 rounded-md">View calendar</Link> : undefined}>
          {upcomingSessions.length > 0 ? (
            <ul className="divide-y divide-stone-100">
              {upcomingSessions.map((s) => (
                <li key={s.id} className="py-3 first:pt-0 last:pb-0">
                  <p className="text-sm font-semibold text-ink">{s.title}</p>
                  <p className="text-xs text-ink-3 mt-0.5">{s.studentName ?? 'Group'} · {s.date} · {s.time}</p>
                  <StatusBadge status="scheduled" />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon="calendar"
              title="No upcoming sessions"
              description="Scheduled coaching sessions will appear here."
            />
          )}
        </Panel>
      </div>

      <Panel title="Recent activity" action={<Link to="/instructor/notifications" className="text-sm font-semibold text-forest-800 hover:text-forest-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600 focus-visible:ring-offset-2 rounded-md">All notifications</Link>}>
        {recentNotifs.length > 0 ? (
          <ul className="divide-y divide-stone-100">
            {recentNotifs.map((n) => (
              <li key={n.id} className="flex items-start gap-3 py-3 first:pt-0">
                {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-forest-600" aria-hidden="true" />}
                <div className={n.read ? 'pl-5' : ''}>
                  <p className="text-sm font-medium text-ink">{n.title}</p>
                  <p className="text-xs text-ink-3">{n.message} · {n.time}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon="bell"
            title="No recent activity"
            description="Enrollments, submissions, and session updates will show up here."
          />
        )}
      </Panel>
    </div>
  )
}

export function InstructorCoursesPage() {
  const { workspace } = useInstructorDashboard()
  const [courses, setCourses] = useState<InstructorCourse[]>(workspace?.courses ?? [])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 8

  const loadCourses = useCallback(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchMyInstructorCourses({ page: 1, pageSize: 100 })
      .then((res) => {
        if (!cancelled) setCourses(res.data)
      })
      .catch((err) => {
        if (!cancelled) {
          setCourses(workspace?.courses ?? [])
          setError(getFriendlyErrorMessage(err, 'Unable to refresh courses.'))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [workspace?.courses])

  useEffect(() => {
    const cleanup = loadCourses()
    return cleanup
  }, [loadCourses])

  const filtered = useMemo(() => {
    let list = courses.filter((c) => filter === 'all' || c.status === filter)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter((c) => c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q))
    }
    return list
  }, [courses, filter, query])

  const paged = usePagination(filtered, pageSize, page)

  return (
    <div className="animate-rise">
      <PageIntro
        eyebrow="Course management"
        title="My Courses"
        description="Create, edit, and publish coaching-led programs. Manage curriculum, assessments, and pricing."
        action={<Button to="/instructor/courses/new" variant="primary" size="md">+ Create new course</Button>}
      />

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {(['all', 'published', 'draft'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => { setFilter(f); setPage(1) }}
              className={`rounded-md px-4 py-2 text-sm font-semibold capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600 focus-visible:ring-offset-2 ${
                filter === f ? 'bg-forest-800 text-white' : 'bg-white border border-stone-200 text-ink-2 hover:bg-stone-50'
              }`}
            >
              {f} {f === 'all' ? `(${courses.length})` : `(${courses.filter((c) => c.status === f).length})`}
            </button>
          ))}
        </div>
        <div className="w-full lg:max-w-sm">
          <label htmlFor="instructor-course-search" className="mb-1.5 block text-sm font-semibold text-ink">
            Search courses
          </label>
          <input
            id="instructor-course-search"
            type="search"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1) }}
            placeholder="Search by title or category"
            className="input-field w-full"
          />
        </div>
      </div>

      {error && (
        <AlertBanner variant="warning" className="mb-6">
          {error}
          <button type="button" className="action-link ml-2 inline-flex" onClick={() => { loadCourses() }}>
            Try again
          </button>
        </AlertBanner>
      )}

      {loading ? (
        <LoadingState label="Loading your courses…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No courses found"
          description="Adjust filters or create a new course to get started."
          action={<Button to="/instructor/courses/new" variant="primary" size="md">Create new course</Button>}
        />
      ) : (
        <>
          <div className="space-y-4">
            {paged.map((course) => (
              <InstructorCourseRow key={course.id} course={course} />
            ))}
          </div>
          <Pagination className="mt-8" page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
