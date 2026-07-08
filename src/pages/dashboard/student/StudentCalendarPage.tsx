import { useMemo, useState } from 'react'
import { useStudentDashboard } from '../../../contexts/DashboardWorkspaceContext'
import { type CalendarEventType } from '../../../data/studentData'
import { PageIntro, Panel, StatTile, TabBar, EmptyState } from '../../../components/student/Panel'
import {
  currentMonthView,
  defaultSelectedDay,
  eventDayOfMonth,
  eventMatchesMonth,
  eventsThisWeek,
  formatIsoDate,
  formatMonthYear,
  getMonthGrid,
  shiftMonth,
  type MonthView,
} from '../../../lib/calendarUtils'

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const typeLabels: Record<CalendarEventType, string> = {
  coaching: 'Coaching',
  live: 'Live class',
  deadline: 'Deadline',
  quiz: 'Quiz',
  module: 'Self-paced',
  batch: 'Batch session',
}

const typeColors: Record<CalendarEventType, string> = {
  coaching: 'bg-forest-100 text-forest-800 border-forest-200',
  live: 'bg-gold-50 text-gold-800 border-gold-200',
  deadline: 'bg-red-50 text-red-800 border-red-200',
  quiz: 'bg-gold-100 text-gold-900 border-gold-200',
  module: 'bg-stone-100 text-ink-2 border-stone-200',
  batch: 'bg-stone-100 text-ink-2 border-stone-300',
}

export function StudentCalendarPage() {
  const { workspace } = useStudentDashboard()
  const studentCalendarEvents = workspace?.calendarEvents ?? []
  const [view, setView] = useState('month')
  const [filter, setFilter] = useState<CalendarEventType | 'all'>('all')
  const [monthView, setMonthView] = useState<MonthView>(currentMonthView)
  const [selectedDay, setSelectedDay] = useState<number | null>(() =>
    defaultSelectedDay(currentMonthView()),
  )

  const filtered = useMemo(
    () => (filter === 'all' ? studentCalendarEvents : studentCalendarEvents.filter((e) => e.type === filter)),
    [filter, studentCalendarEvents],
  )

  const monthEvents = useMemo(
    () => filtered.filter((e) => eventMatchesMonth(e.date, monthView)),
    [filtered, monthView],
  )

  const weekEvents = useMemo(() => eventsThisWeek(filtered), [filtered])

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

  const filterTabs = [
    { id: 'all', label: 'All events', count: studentCalendarEvents.length },
    { id: 'coaching', label: 'Coaching', count: studentCalendarEvents.filter((e) => e.type === 'coaching').length },
    { id: 'deadline', label: 'Deadlines', count: studentCalendarEvents.filter((e) => e.type === 'deadline').length },
    { id: 'live', label: 'Live', count: studentCalendarEvents.filter((e) => e.type === 'live' || e.type === 'batch').length },
  ]

  const changeMonth = (delta: number) => {
    const next = shiftMonth(monthView, delta)
    setMonthView(next)
    setSelectedDay(defaultSelectedDay(next))
  }

  return (
    <div className="animate-rise">
      <PageIntro
        eyebrow="Schedule"
        title="Learning Calendar"
        description="Coaching sessions, assignment deadlines, live classes, and batch events — all in one place."
      />

      <div className="stat-grid mb-6 sm:mb-8">
        <StatTile label="This week" value={weekEvents.length} hint="Scheduled events" />
        <StatTile label="Coaching sessions" value={studentCalendarEvents.filter((e) => e.type === 'coaching').length} />
        <StatTile label="Due this week" value={weekEvents.filter((e) => e.type === 'deadline').length} hint="Assignments & labs" />
        <StatTile label="Live sessions" value={studentCalendarEvents.filter((e) => e.type === 'live' || e.type === 'batch').length} />
      </div>

      <TabBar tabs={filterTabs} active={filter} onChange={(id) => setFilter(id as CalendarEventType | 'all')} />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(['month', 'agenda'] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize ${view === v ? 'bg-forest-800 text-white' : 'bg-stone-100 text-ink-3 hover:text-ink-2'}`}
          >
            {v}
          </button>
        ))}
      </div>

      {view === 'month' ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <Panel
            title={formatMonthYear(monthView)}
            className="lg:col-span-2"
            action={
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => changeMonth(-1)}
                  className="rounded-md px-2 py-1 text-xs font-semibold text-ink-3 hover:bg-stone-100 hover:text-ink"
                  aria-label="Previous month"
                >
                  ←
                </button>
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
                <button
                  type="button"
                  onClick={() => changeMonth(1)}
                  className="rounded-md px-2 py-1 text-xs font-semibold text-ink-3 hover:bg-stone-100 hover:text-ink"
                  aria-label="Next month"
                >
                  →
                </button>
              </div>
            }
          >
            <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-semibold text-ink-3">
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
                    className={`min-h-10 sm:min-h-11 aspect-square rounded-md flex flex-col items-center justify-center text-xs sm:text-sm transition-colors active:scale-95 ${
                      !inMonth ? 'text-ink-4/30 cursor-default'
                      : isSelected ? 'bg-forest-800 font-bold text-white ring-2 ring-forest-600 ring-offset-1'
                      : hasEvent ? 'bg-forest-100 font-bold text-forest-800 hover:bg-forest-200'
                      : 'hover:bg-stone-100 text-ink-2'
                    }`}
                  >
                    {inMonth ? day : ''}
                    {hasEvent && !isSelected && <span className="mt-0.5 h-1 w-1 rounded-full bg-forest-600" />}
                  </button>
                )
              })}
            </div>
          </Panel>

          <Panel title={selectedDay ? `${formatMonthYear(monthView).split(' ')[0]} ${selectedDay} — Events` : 'Select a day'}>
            {dayEvents.length === 0 ? (
              <p className="empty-inline py-8">No events on this day.</p>
            ) : (
              <ul className="space-y-3">
                {dayEvents.map((e) => (
                  <li key={e.id} className={`rounded-lg border p-3 ${typeColors[e.type]}`}>
                    <p className="text-sm font-semibold">{e.title}</p>
                    <p className="text-xs mt-0.5 opacity-80">{e.time}{e.courseTitle ? ` · ${e.courseTitle}` : ''}</p>
                    {e.location && <p className="text-xs mt-1 opacity-70">{e.location}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      ) : (
        <Panel title="Upcoming agenda">
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <EmptyState
                icon="calendar"
                title="No events match this filter"
                description="Try a different filter or check back when new sessions and deadlines are scheduled."
              />
            ) : (
              filtered.map((e) => (
                <div key={e.id} className="flex flex-col gap-2 rounded-xl border border-stone-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${typeColors[e.type]}`}>
                        {typeLabels[e.type]}
                      </span>
                      <p className="font-semibold text-ink">{e.title}</p>
                    </div>
                    <p className="mt-1 text-sm text-ink-3">
                      {formatIsoDate(e.date)} · {e.time}
                      {e.courseTitle ? ` · ${e.courseTitle}` : ''}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Panel>
      )}
    </div>
  )
}
