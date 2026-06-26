import { useState } from 'react'
import { analyticsData, calendarEvents, instructorNotifications } from '../../../data/instructorData'
import { PageIntro, Panel, StatTile } from '../../../components/dashboard/PageShell'
import { Button } from '../../../components/ui/Button'

export function InstructorNotificationsPage() {
  const [items, setItems] = useState(instructorNotifications)
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
              const hasEvent = [25, 26, 27, 28, 30].includes(day)
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
  const { enrollmentTrend, completionTrend, revenueTrend, engagementRate, avgSessionRating, topCourses } = analyticsData
  const maxEnroll = Math.max(...enrollmentTrend)

  return (
    <div className="animate-rise">
      <PageIntro eyebrow="Insights" title="Analytics" description="Enrollment trends, completion rates, and revenue performance." />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Engagement rate" value={`${engagementRate}%`} hint="Active learners this month" />
        <StatTile label="Session rating" value={avgSessionRating} hint="Coaching satisfaction" />
        <StatTile label="Monthly revenue" value="₹12,480" hint="+8% vs last month" />
        <StatTile label="New enrollments" value="28" hint="Last 30 days" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Enrollment trend">
          <div className="flex items-end gap-2 h-40">
            {enrollmentTrend.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-sm bg-forest-600" style={{ height: `${(v / maxEnroll) * 100}%`, minHeight: 8 }} />
                <span className="text-[10px] text-ink-4">W{i + 1}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Completion rate trend">
          <div className="flex items-end gap-2 h-40">
            {completionTrend.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-sm bg-gold-500" style={{ height: `${v}%`, minHeight: 8 }} />
                <span className="text-[10px] text-ink-4">W{i + 1}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Revenue trend" className="lg:col-span-2">
          <div className="flex items-end gap-2 h-32">
            {revenueTrend.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-sm bg-forest-800" style={{ height: `${(v / 12480) * 100}%`, minHeight: 8 }} />
                <span className="text-[10px] text-ink-4">W{i + 1}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Top performing courses" className="mt-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {topCourses.map((c) => (
            <div key={c.id} className="rounded-lg border border-stone-100 p-4">
              <p className="font-semibold text-ink text-sm">{c.title}</p>
              <p className="text-xs text-ink-3 mt-1">{c.students} students · {c.completion}% completion</p>
              <p className="text-sm font-bold text-forest-800 mt-2">★ {c.rating}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}
