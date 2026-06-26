import { Link } from 'react-router-dom'
import type { UpcomingActivity } from '../../data/studentData'
import { learningSummary, weeklyLearning } from '../../data/studentData'
import { Panel } from './Panel'

const activityStyles: Record<UpcomingActivity['type'], { dot: string; label?: string }> = {
  coaching: { dot: 'bg-gold-500', label: 'Coaching' },
  live: { dot: 'bg-red-500', label: 'Live' },
  module: { dot: 'bg-forest-500' },
  assignment: { dot: 'bg-orange-500', label: 'Due' },
  quiz: { dot: 'bg-violet-500', label: 'Quiz' },
  deadline: { dot: 'bg-red-400', label: 'Deadline' },
}

export function StreakWidget() {
  const { streak, longestStreak, weeklyHours, weeklyGoal } = learningSummary
  const goalProgress = Math.min(100, Math.round((weeklyHours / weeklyGoal) * 100))

  return (
    <Panel title="Learning streak">
      <div className="flex items-center gap-6">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gold-50">
          <span className="text-3xl" aria-hidden="true">🔥</span>
        </div>
        <div>
          <p className="font-display text-3xl font-bold text-ink">{streak} days</p>
          <p className="text-sm text-ink-3">Personal best: {longestStreak} days</p>
        </div>
      </div>
      <div className="mt-5 border-t border-stone-100 pt-5">
        <div className="mb-2 flex justify-between text-xs">
          <span className="font-medium text-ink-2">Weekly goal</span>
          <span className="text-ink-3">{weeklyHours}h / {weeklyGoal}h</span>
        </div>
        <div className="h-1.5 rounded-full bg-stone-100">
          <div className="h-full rounded-full bg-gold-500" style={{ width: `${goalProgress}%` }} />
        </div>
      </div>
    </Panel>
  )
}

export function WeeklyActivityChart() {
  const maxHours = Math.max(...weeklyLearning.map((d) => d.hours), 1)

  return (
    <Panel title="This week">
      <div className="flex items-end justify-between gap-2" style={{ height: 100 }}>
        {weeklyLearning.map((day) => (
          <div key={day.day} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex w-full flex-1 items-end">
              <div
                className={`w-full rounded-sm transition-all ${
                  day.active ? 'bg-forest-600' : 'bg-stone-200'
                }`}
                style={{ height: `${Math.max(8, (day.hours / maxHours) * 100)}%` }}
                title={`${day.hours}h`}
              />
            </div>
            <span className="text-[10px] font-medium text-ink-3">{day.day}</span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-ink-3">
        {learningSummary.weeklyHours} hours logged · {learningSummary.weeklyGoal - learningSummary.weeklyHours}h to weekly goal
      </p>
    </Panel>
  )
}

export function UpcomingActivitiesList({ activities }: { activities: UpcomingActivity[] }) {
  return (
    <Panel
      title="Upcoming activities"
      action={
        <Link to="/dashboard/assignments" className="text-sm font-semibold text-forest-800 hover:text-forest-900">
          View all
        </Link>
      }
      noPadding
    >
      <ul className="divide-y divide-stone-100">
        {activities.map((item) => {
          const style = activityStyles[item.type]
          return (
            <li key={item.id} className="flex items-center gap-4 px-5 py-4 md:px-6 hover:bg-stone-50/50 transition-colors">
              <span className={`flex h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{item.title}</p>
                <p className="text-xs text-ink-3 mt-0.5 truncate">{item.subtitle}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs font-medium text-ink-2">{item.datetime}</p>
                {style.label && (
                  <span className="mt-0.5 inline-block text-[10px] font-bold uppercase tracking-wider text-ink-4">
                    {style.label}
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}

export function LearningSummaryStrip() {
  const items = [
    { label: 'Total hours', value: `${learningSummary.totalHours}h` },
    { label: 'Active courses', value: learningSummary.activeCourses },
    { label: 'Overall progress', value: `${learningSummary.overallProgress}%` },
    { label: 'Coaching sessions', value: learningSummary.coachingSessionsThisMonth, hint: 'this month' },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl border border-stone-200 bg-white px-4 py-4 shadow-[0_1px_2px_rgba(10,10,10,0.04)]">
          <p className="text-[11px] font-medium uppercase tracking-wider text-ink-3">{item.label}</p>
          <p className="mt-1 font-display text-2xl font-bold text-ink">
            {item.value}
            {item.hint && <span className="ml-1 text-sm font-normal text-ink-3">{item.hint}</span>}
          </p>
        </div>
      ))}
    </div>
  )
}
