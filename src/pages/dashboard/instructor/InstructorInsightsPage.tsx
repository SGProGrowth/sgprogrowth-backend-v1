import { useEffect, useState } from 'react'
import { useInstructorDashboard } from '../../../hooks/useInstructorDashboard'
import { fetchInstructorAnalytics, fetchInstructorHeatmap, type InstructorAnalytics } from '../../../lib/api/analytics'
import { downloadAssignmentReport, downloadBatchReport, downloadCertificateReport, downloadCourseReport, downloadQuizReport } from '../../../lib/api/reports'
import { PageIntro, Panel, StatTile } from '../../../components/dashboard/PageShell'
import { SelectField } from '../../../components/instructor/FormField'
import { Button } from '../../../components/ui/Button'

export function InstructorNotificationsPage() {
  const { workspace } = useInstructorDashboard()
  const [items, setItems] = useState(workspace?.notifications ?? [])

  useEffect(() => {
    setItems(workspace?.notifications ?? [])
  }, [workspace])

  const unread = items.filter((n) => !n.read)

  return (
    <div className="animate-rise">
      <PageIntro
        eyebrow="Alerts"
        title="Notifications"
        description="Enrollments, submissions, reviews, and session reminders."
        action={unread.length > 0 ? (
          <button type="button" onClick={() => setItems((p) => p.map((n) => ({ ...n, read: true })))} className="text-sm font-semibold text-forest-800">
            Mark all read
          </button>
        ) : undefined}
      />

      <div className="space-y-3">
        {items.map((n) => (
          <div key={n.id} className={`rounded-xl border p-5 ${n.read ? 'border-stone-200 bg-white' : 'border-forest-200 bg-forest-50/30'}`}>
            <div className="flex items-start justify-between gap-2">
              <p className={`text-sm font-semibold ${n.read ? 'text-ink-2' : 'text-ink'}`}>{n.title}</p>
              {!n.read && <span className="h-2 w-2 rounded-full bg-forest-600" />}
            </div>
            <p className="mt-1 text-sm text-ink-3">{n.message}</p>
            <p className="mt-2 text-xs text-ink-4">{n.time}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function InstructorCalendarPage() {
  const { workspace } = useInstructorDashboard()
  const calendarEvents = workspace?.calendarEvents ?? []
  const eventDays = new Set(
    calendarEvents
      .map((e) => parseInt(e.date.split(' ')[1]?.replace(',', '') ?? '', 10))
      .filter((d) => !Number.isNaN(d)),
  )

  return (
    <div className="animate-rise">
      <PageIntro eyebrow="Schedule" title="Calendar" description="Coaching sessions, deadlines, and live events." action={<Button variant="primary" size="md">+ Add event</Button>} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="June 2026" className="lg:col-span-2">
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-ink-3 mb-2">
            {days.map((d) => <span key={d}>{d}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }, (_, i) => {
              const day = i - 2
              const hasEvent = eventDays.has(day)
              return (
                <div key={i} className={`aspect-square rounded-md flex items-center justify-center text-sm ${day < 1 || day > 30 ? 'text-ink-4/30' : hasEvent ? 'bg-forest-100 font-bold text-forest-800' : 'hover:bg-stone-100 text-ink-2'}`}>
                  {day >= 1 && day <= 30 ? day : ''}
                </div>
              )
            })}
          </div>
        </Panel>

        <Panel title="Upcoming events">
          <ul className="space-y-4">
            {calendarEvents.map((e) => (
              <li key={e.id} className="border-l-2 border-forest-600 pl-3">
                <p className="text-sm font-semibold text-ink">{e.title}</p>
                <p className="text-xs text-ink-3">{e.date} · {e.time}</p>
                {e.courseTitle && <p className="text-xs text-ink-4">{e.courseTitle}</p>}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}

export function InstructorAnalyticsPage() {
  const { workspace } = useInstructorDashboard()
  const summary = workspace?.summary
  const courses = workspace?.courses ?? []
  const [courseSlug, setCourseSlug] = useState(courses[0]?.id ?? '')
  const [analytics, setAnalytics] = useState<InstructorAnalytics | null>(null)
  const [heatmap, setHeatmap] = useState<{ grid: Array<{ day: string; hours: Array<{ hour: number; count: number }> }> } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (courses.length && !courseSlug) setCourseSlug(courses[0].id)
  }, [courses, courseSlug])

  useEffect(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      fetchInstructorAnalytics(courseSlug ? { courseSlug } : undefined),
      fetchInstructorHeatmap(courseSlug || undefined),
    ])
      .then(([a, h]) => {
        setAnalytics(a)
        setHeatmap(h as typeof heatmap)
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load analytics'))
      .finally(() => setLoading(false))
  }, [courseSlug])

  if (!summary) {
    return (
      <div className="animate-rise rounded-xl border border-stone-200 bg-white px-6 py-12 text-center">
        <p className="font-display text-base font-bold text-ink">Analytics unavailable</p>
        <p className="mt-2 text-sm text-ink-3">Sign in with a registered instructor account.</p>
      </div>
    )
  }

  const enrollmentTrend = analytics?.enrollmentTrend ?? []
  const completionTrend = analytics?.completionTrend ?? []
  const maxEnroll = Math.max(...enrollmentTrend.map((t) => t.count), 1)
  const maxHeat = heatmap
    ? Math.max(...heatmap.grid.flatMap((g) => g.hours.map((h) => h.count)), 1)
    : 1

  return (
    <div className="animate-rise">
      <PageIntro
        eyebrow="Insights"
        title="Analytics"
        description="Enrollment trends, completion rates, engagement, and batch performance."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => downloadCourseReport('csv', courseSlug || undefined).catch(() => setError('Export failed'))}>
              Export courses
            </Button>
            <Button variant="ghost" size="sm" onClick={() => downloadAssignmentReport('csv', courseSlug || undefined).catch(() => setError('Export failed'))}>
              Assignments CSV
            </Button>
          </div>
        }
      />

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      <div className="mb-6 max-w-xs">
        <SelectField
          label="Filter by course"
          value={courseSlug}
          onChange={(e) => setCourseSlug(e.target.value)}
          options={[
            { value: '', label: 'All courses' },
            ...courses.map((c) => ({ value: c.id, label: c.title })),
          ]}
        />
      </div>

      {loading && !analytics ? (
        <p className="text-sm text-ink-3 py-8 text-center">Loading analytics…</p>
      ) : analytics && (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="Total students" value={analytics.totalStudents} hint={`${analytics.activeStudents} active (7d)`} />
            <StatTile label="Engagement rate" value={`${analytics.engagementRate}%`} hint="Active learners" />
            <StatTile label="Course completion" value={`${analytics.courseCompletionRate}%`} hint="Completed enrollments" />
            <StatTile label="At risk" value={analytics.studentsAtRisk} hint="Below 30% progress" />
          </div>

          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="Assignment completion" value={`${analytics.assignmentCompletionRate}%`} hint={`Avg score ${analytics.averageAssignmentScore}`} />
            <StatTile label="Quiz completion" value={`${analytics.quizCompletionRate}%`} hint={`Avg score ${analytics.averageQuizScore}%`} />
            <StatTile label="Certificates issued" value={analytics.certificatesIssued} hint="Selected period" />
            <StatTile label="New enrollments" value={summary.newEnrollments} hint="Last 30 days" />
          </div>

          {analytics.studentsAtRiskList.length > 0 && (
            <Panel title="Students falling behind" className="mb-8">
              <ul className="space-y-3">
                {analytics.studentsAtRiskList.map((s) => (
                  <li key={s.studentId} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-ink">{s.name}</span>
                    <span className="text-ink-3">{s.courseTitle} · {s.progressPct}%</span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {analytics.batchPerformance.length > 0 && (
            <Panel title="Batch performance" className="mb-8">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {analytics.batchPerformance.map((b) => (
                  <div key={b.id} className="rounded-lg border border-stone-100 p-4">
                    <p className="font-semibold text-ink text-sm">{b.name}</p>
                    <p className="text-xs text-ink-3 mt-1">{b.courseTitle} · {b.studentsCount} students</p>
                    <p className="text-sm font-bold text-forest-800 mt-2">{b.completionRate}% completion</p>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          <div className="grid gap-6 lg:grid-cols-2 mb-8">
            <Panel title="Enrollment trend">
              <div className="flex items-end gap-2 h-40">
                {enrollmentTrend.map((t) => (
                  <div key={t.month} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-sm bg-forest-600" style={{ height: `${(t.count / maxEnroll) * 100}%`, minHeight: 8 }} />
                    <span className="text-[10px] text-ink-4">{t.month}</span>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Completion rate trend">
              <div className="flex items-end gap-2 h-40">
                {completionTrend.map((t) => (
                  <div key={t.month} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-sm bg-gold-500" style={{ height: `${t.rate}%`, minHeight: 8 }} />
                    <span className="text-[10px] text-ink-4">{t.month}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          {heatmap && (
            <Panel title="Learning activity heatmap" className="mb-8">
              <div className="overflow-x-auto">
                <div className="min-w-[640px] grid gap-1" style={{ gridTemplateColumns: '48px repeat(24, 1fr)' }}>
                  <div />
                  {Array.from({ length: 24 }, (_, h) => (
                    <div key={h} className="text-[8px] text-center text-ink-4">{h}</div>
                  ))}
                  {heatmap.grid.map((row) => (
                    <div key={row.day} className="contents">
                      <div className="text-[10px] font-semibold text-ink-3 pr-1">{row.day}</div>
                      {row.hours.map((cell) => (
                        <div
                          key={`${row.day}-${cell.hour}`}
                          className="aspect-square rounded-sm"
                          style={{
                            backgroundColor: cell.count
                              ? `rgba(27, 67, 50, ${0.15 + (cell.count / maxHeat) * 0.85})`
                              : '#f5f5f4',
                          }}
                          title={`${cell.count} activities`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </Panel>
          )}

          <Panel title="Download reports">
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => downloadAssignmentReport('csv', courseSlug || undefined)}>Assignments CSV</Button>
              <Button variant="secondary" size="sm" onClick={() => downloadQuizReport('pdf', courseSlug || undefined)}>Quizzes PDF</Button>
              <Button variant="secondary" size="sm" onClick={() => downloadBatchReport('xlsx')}>Batches Excel</Button>
              <Button variant="secondary" size="sm" onClick={() => downloadCertificateReport('csv', courseSlug || undefined)}>Certificates CSV</Button>
            </div>
          </Panel>
        </>
      )}
    </div>
  )
}
