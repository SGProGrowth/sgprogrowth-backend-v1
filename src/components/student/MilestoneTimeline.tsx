import type { LearningMilestone } from '../../data/studentData'

const statusStyles = {
  completed: {
    circle: 'bg-forest-700 text-white border-forest-700',
    line: 'bg-forest-200',
  },
  'in-progress': {
    circle: 'bg-gold-500 text-white border-gold-500 ring-4 ring-gold-100',
    line: 'bg-stone-200',
  },
  upcoming: {
    circle: 'bg-white text-ink-4 border-stone-300 border-2',
    line: 'bg-stone-200',
  },
}

export function MilestoneTimeline({ milestones }: { milestones: LearningMilestone[] }) {
  return (
    <div className="relative">
      {milestones.map((milestone, idx) => {
        const styles = statusStyles[milestone.status]
        const isLast = idx === milestones.length - 1

        return (
          <div key={milestone.id} className="relative flex gap-4 pb-8 last:pb-0">
            {!isLast && (
              <div className={`absolute left-[15px] top-8 h-[calc(100%-16px)] w-0.5 ${styles.line}`} />
            )}
            <div
              className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${styles.circle}`}
            >
              {milestone.status === 'completed' ? (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : milestone.status === 'in-progress' ? (
                <span className="h-2 w-2 rounded-full bg-white" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-stone-300" />
              )}
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-forest-700">{milestone.phase}</p>
              <h4 className="mt-0.5 font-display text-sm font-bold text-ink">{milestone.title}</h4>
              <p className="mt-1 text-sm text-ink-3">{milestone.description}</p>
              <p className="mt-1.5 text-xs font-medium text-ink-4">{milestone.date}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface ModuleProgressProps {
  title: string
  progress: number
  modules: Array<{ number: number; title: string; status: 'completed' | 'current' | 'locked' }>
}

export function CourseModuleProgress({ title, progress, modules }: ModuleProgressProps) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
      <div className="border-b border-stone-100 px-5 py-4 md:px-6">
        <div className="flex items-center justify-between gap-4">
          <h3 className="font-display text-sm font-bold text-ink">{title}</h3>
          <span className="rounded-md bg-forest-50 px-2.5 py-1 text-xs font-bold text-forest-800">{progress}%</span>
        </div>
        <div className="mt-3 h-1.5 rounded-full bg-stone-100">
          <div className="h-full rounded-full bg-forest-700" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <ul className="divide-y divide-stone-50">
        {modules.map((mod) => (
          <li
            key={mod.number}
            className={`flex items-center gap-3 px-5 py-3 md:px-6 ${
              mod.status === 'current' ? 'bg-forest-50/50' : ''
            }`}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                mod.status === 'completed'
                  ? 'bg-forest-700 text-white'
                  : mod.status === 'current'
                    ? 'bg-gold-500 text-white'
                    : 'bg-stone-100 text-ink-4'
              }`}
            >
              {mod.status === 'completed' ? '✓' : mod.number}
            </span>
            <span className={`text-sm ${mod.status === 'locked' ? 'text-ink-4' : 'text-ink-2 font-medium'}`}>
              {mod.title}
            </span>
            {mod.status === 'current' && (
              <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-gold-600">Current</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
