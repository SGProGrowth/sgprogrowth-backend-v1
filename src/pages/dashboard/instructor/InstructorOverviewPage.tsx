import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getGreeting } from '../../../data/instructorData'
import { useInstructorDashboard } from '../../../hooks/useInstructorDashboard'
import { PageIntro, Panel, StatTile } from '../../../components/dashboard/PageShell'
import { InstructorCourseRow } from '../../../components/instructor/CourseCard'
import { StatusBadge } from '../../../components/instructor/StatusBadge'
import { Button } from '../../../components/ui/Button'
import { Pagination, usePagination } from '../../../components/ui/Pagination'

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
      <header className="rounded-2xl border border-stone-200 bg-white px-6 py-8 md:px-8">
        <p className="text-label mb-2">Instructor dashboard</p>
        <h1 className="text-display-lg text-ink">{getGreeting()}, {firstName}</h1>
        <p className="mt-3 max-w-2xl text-body-lg">
          {hasCourses
            ? `${summary.sessionsThisWeek} coaching sessions this week · ${summary.pendingGrades} submissions awaiting review.`
            : 'Create your first course to start teaching and tracking student progress.'}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button to="/instructor/courses/new" variant="primary" size="md">Create new course</Button>
          <Button to="/instructor/coaching" variant="secondary" size="md">Schedule session</Button>
          <Button to="/instructor/grades" variant="ghost" size="md">Review grades ({summary.pendingGrades})</Button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Total students" value={summary.totalStudents} hint={`+${summary.newEnrollments} this month`} />
        <StatTile label="Active courses" value={summary.activeCourses} hint={`${enrollingNow} published`} />
        <StatTile label="Avg. completion" value={`${summary.avgCompletion}%`} hint="Across published courses" />
        <StatTile label="Monthly revenue" value={summary.monthlyRevenue} hint="Before fees" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Panel title="Your courses" className="lg:col-span-3" action={<Link to="/instructor/courses" className="text-sm font-semibold text-forest-800">Manage all</Link>}>
          <div className="space-y-4">
            {recentCourses.map((c) => (
              <InstructorCourseRow key={c.id} course={c} />
            ))}
          </div>
        </Panel>

        <Panel title="Upcoming sessions" className="lg:col-span-2" action={<Link to="/instructor/coaching" className="text-sm font-semibold text-forest-800">View all</Link>}>
          <ul className="divide-y divide-stone-100">
            {upcomingSessions.map((s) => (
              <li key={s.id} className="py-3 first:pt-0 last:pb-0">
                <p className="text-sm font-semibold text-ink">{s.title}</p>
                <p className="text-xs text-ink-3 mt-0.5">{s.studentName ?? 'Group'} · {s.date} · {s.time}</p>
                <StatusBadge status="scheduled" />
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Recent activity" action={<Link to="/instructor/notifications" className="text-sm font-semibold text-forest-800">All notifications</Link>}>
        <ul className="divide-y divide-stone-100">
          {recentNotifs.map((n) => (
            <li key={n.id} className="flex items-start gap-3 py-3 first:pt-0">
              {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-forest-600" />}
              <div className={n.read ? 'pl-5' : ''}>
                <p className="text-sm font-medium text-ink">{n.title}</p>
                <p className="text-xs text-ink-3">{n.message} · {n.time}</p>
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  )
}

export function InstructorCoursesPage() {
  const { workspace } = useInstructorDashboard()
  const courses = workspace?.courses ?? []
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 8

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
              className={`rounded-md px-4 py-2 text-sm font-semibold capitalize transition-colors ${
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

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50/50 px-6 py-16 text-center">
          <p className="font-display text-base font-bold text-ink">No courses found</p>
          <p className="mt-1 text-sm text-ink-3">Adjust filters or create a new course to get started.</p>
        </div>
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
