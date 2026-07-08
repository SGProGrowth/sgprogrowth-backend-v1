import { useCallback, useEffect, useMemo, useState } from 'react'
import { useInstructorDashboard } from '../../../hooks/useInstructorDashboard'
import { AlertBanner } from '../../../components/ui/AlertBanner'
import { getFriendlyErrorMessage } from '../../../lib/api/errors'
import { markAllInstructorNotificationsRead } from '../../../lib/api/profile'
import {
  fetchInstructorAnalytics,
  fetchInstructorHeatmap,
  type InstructorAnalytics,
  downloadAssignmentReport,
  downloadBatchReport,
  downloadCertificateReport,
  downloadCourseReport,
  downloadQuizReport,
} from '../../../lib/api/analytics'
import { PageIntro, Panel, StatTile, EmptyState } from '../../../components/dashboard/PageShell'
import { SelectField } from '../../../components/instructor/FormField'
import { Button } from '../../../components/ui/Button'
import { LoadingState } from '../../../components/ui/LoadingState'
import {
  currentMonthView,
  defaultSelectedDay,
  eventDayOfMonth,
  eventMatchesMonth,
  formatIsoDate,
  formatMonthYear,
  getMonthGrid,
  shiftMonth,
  type MonthView,
} from '../../../lib/calendarUtils'

export function InstructorNotificationsPage() {
  const { workspace, refresh } = useInstructorDashboard()
  const [items, setItems] = useState(workspace?.notifications ?? [])
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    setItems(workspace?.notifications ?? [])
  }, [workspace])

  const unread = items.filter((n) => !n.read)

  const markAllRead = () => {
    setActionError('')
    setItems((p) => p.map((n) => ({ ...n, read: true })))
    void markAllInstructorNotificationsRead()
      .then(() => refresh())
      .catch(() => setActionError('Could not mark all notifications as read. Please try again.'))
  }

  return (
    <div className="animate-rise">
      <PageIntro
        eyebrow="Alerts"
        title="Notifications"
        description="Enrollments, submissions, reviews, and session reminders."
        action={unread.length > 0 ? (
          <button
            type="button"
            onClick={markAllRead}
            className="action-link"
          >
            Mark all read
          </button>
        ) : undefined}
      />

      {actionError && (
        <AlertBanner variant="error" className="mb-4">
          {actionError}
        </AlertBanner>
      )}

      <div className="space-y-3">
        {items.length > 0 ? (
          items.map((n) => (
            <div key={n.id} className={`rounded-xl border p-5 ${n.read ? 'border-stone-200 bg-white' : 'border-forest-200 bg-forest-50/30'}`}>
              <div className="flex items-start justify-between gap-2">
                <p className={`text-sm font-semibold ${n.read ? 'text-ink-2' : 'text-ink'}`}>{n.title}</p>
                {!n.read && <span className="h-2 w-2 rounded-full bg-forest-600" aria-hidden="true" />}
              </div>
              <p className="mt-1 text-sm text-ink-3">{n.message}</p>
              <p className="mt-2 text-xs text-ink-4">{n.time}</p>
            </div>
          ))
        ) : (
          <EmptyState
            icon="bell"
            title="No notifications yet"
            description="Enrollments, submissions, and session reminders will appear here."
          />
        )}
      </div>
    </div>
  )
}

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function InstructorCalendarPage() {
  const { workspace } = useInstructorDashboard()
  const calendarEvents = workspace?.calendarEvents ?? []
  const [monthView, setMonthView] = useState<MonthView>(currentMonthView)
  const [selectedDay, setSelectedDay] = useState<number | null>(() =>
    defaultSelectedDay(currentMonthView()),
  )

  const monthEvents = useMemo(
    () => calendarEvents.filter((e) => eventMatchesMonth(e.date, monthView)),
    [calendarEvents, monthView],
  )

  const eventDays = useMemo(
    () =>
      new Set(
        monthEvents
          .map((e) => eventDayOfMonth(e.date))
          .filter((d): d is number => d !== null),
      ),
    [monthEvents],
  )

  const dayEvents = useMemo(
    () =>
      selectedDay
        ? monthEvents.filter((e) => eventDayOfMonth(e.date) === selectedDay)
        : [],
    [monthEvents, selectedDay],
  )

  const { daysInMonth, startOffset } = getMonthGrid(monthView)
  const gridCells = startOffset + daysInMonth
  const paddedCells = Math.ceil(gridCells / 7) * 7

  const changeMonth = (delta: number) => {
    const next = shiftMonth(monthView, delta)
    setMonthView(next)
    setSelectedDay(defaultSelectedDay(next))
  }

  return (
    <div className="animate-rise">
      <PageIntro eyebrow="Schedule" title="Calendar" description="Coaching sessions, deadlines, and live events." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel
          title={formatMonthYear(monthView)}
          className="lg:col-span-2"
          action={
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => changeMonth(-1)} className="rounded-md px-2 py-1 text-xs font-semibold text-ink-3 hover:bg-stone-100 hover:text-ink" aria-label="Previous month">←</button>
              <button
                type="button"
                onClick={() => {
                  const now = currentMonthView()
                  setMonthView(now)
                  setSelectedDay(defaultSelectedDay(now))
                }}
                className="rounded-md px-2 py-1 text-xs font-semibold text-ink-3 hover:bg-stone-100 hover:text-ink"
              >
                Today
              </button>
              <button type="button" onClick={() => changeMonth(1)} className="rounded-md px-2 py-1 text-xs font-semibold text-ink-3 hover:bg-stone-100 hover:text-ink" aria-label="Next month">→</button>
            </div>
          }
        >
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-ink-3 mb-2">
            {days.map((d) => <span key={d}>{d}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: paddedCells }, (_, i) => {
              const day = i - startOffset + 1
              const inMonth = day >= 1 && day <= daysInMonth
              const hasEvent = inMonth && eventDays.has(day)
              const isSelected = selectedDay === day
              return (
                <button
                  key={i}
                  type="button"
                  disabled={!inMonth}
                  onClick={() => inMonth && setSelectedDay(day)}
                  className={`aspect-square rounded-md flex items-center justify-center text-sm transition-colors ${
                    !inMonth ? 'text-ink-4/30 cursor-default'
                    : isSelected ? 'bg-forest-800 font-bold text-white'
                    : hasEvent ? 'bg-forest-100 font-bold text-forest-800 hover:bg-forest-200'
                    : 'hover:bg-stone-100 text-ink-2'
                  }`}
                >
                  {inMonth ? day : ''}
                </button>
              )
            })}
          </div>
        </Panel>

        <Panel title={selectedDay ? `${formatMonthYear(monthView).split(' ')[0]} ${selectedDay} — Events` : 'Upcoming events'}>
          {(selectedDay ? dayEvents : calendarEvents).length > 0 ? (
            <ul className="space-y-4">
              {(selectedDay ? dayEvents : calendarEvents).map((e) => (
                <li key={e.id} className="border-l-2 border-forest-600 pl-3">
                  <p className="text-sm font-semibold text-ink">{e.title}</p>
                  <p className="text-xs text-ink-3">{formatIsoDate(e.date)} · {e.time}</p>
                  {e.courseTitle && <p className="text-xs text-ink-4">{e.courseTitle}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon="calendar"
              title="No upcoming events"
              description="Scheduled coaching sessions and deadlines will appear on your calendar."
            />
          )}
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

  const loadAnalytics = useCallback(() => {
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
      .catch((err: unknown) => setError(getFriendlyErrorMessage(err, 'Failed to load analytics.')))
      .finally(() => setLoading(false))
  }, [courseSlug])

  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])

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
        <AlertBanner variant="error" className="mb-4">
          {error}
          <button type="button" className="action-link ml-2 inline-flex" onClick={loadAnalytics}>
            Try again
          </button>
        </AlertBanner>
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
        <LoadingState label="Loading analytics…" />
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
              <div className="table-scroll">
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
