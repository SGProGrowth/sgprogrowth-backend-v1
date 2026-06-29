import { useState } from 'react'
import { useStudentDashboard } from '../../../hooks/useStudentDashboard'
import { PageIntro, Panel, StatTile, TabBar, EmptyState } from '../../../components/student/Panel'
import { ProgressBar } from '../../../components/student/ProgressBar'
import { Button } from '../../../components/ui/Button'

export function StudentBatchesPage() {
  const { workspace } = useStudentDashboard()
  const studentBatches = workspace?.batches ?? []
  const [tab, setTab] = useState('active')

  const active = studentBatches.filter((b) => b.status === 'active')
  const upcoming = studentBatches.filter((b) => b.status === 'upcoming')
  const completed = studentBatches.filter((b) => b.status === 'completed')

  const tabs = [
    { id: 'active', label: 'Active batches', count: active.length },
    { id: 'upcoming', label: 'Upcoming', count: upcoming.length },
    { id: 'completed', label: 'Completed', count: completed.length },
  ]

  const displayed = tab === 'active' ? active : tab === 'upcoming' ? upcoming : completed

  return (
    <div className="animate-rise">
      <PageIntro
        eyebrow="Cohorts"
        title="My Batches"
        description="Your enrolled cohorts with schedules, batchmates, and upcoming group sessions."
      />

      <div className="stat-grid-3 mb-6 sm:mb-8">
        <StatTile label="Active batches" value={active.length} hint="Currently enrolled" />
        <StatTile label="Batchmates" value="7" hint="Across active cohorts" />
        <StatTile label="Next group session" value="Jun 29" hint="AWS cohort sync · 6:00 PM" />
      </div>

      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {displayed.length === 0 ? (
        <EmptyState
          title="No batches in this category"
          description="When you enroll in a cohort-based program, your batch details will appear here."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {displayed.map((batch) => (
            <article key={batch.id} className="rounded-xl border border-stone-200 bg-white shadow-[0_1px_2px_rgba(10,10,10,0.04)] overflow-hidden">
              <div className="border-b border-stone-100 bg-gradient-to-r from-forest-800 to-forest-900 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/70">{batch.courseTitle}</p>
                <h3 className="font-display text-lg font-bold text-white mt-1">{batch.name}</h3>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-ink-4">Instructor</p>
                    <p className="font-semibold text-ink">{batch.instructor}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-4">Coach</p>
                    <p className="font-semibold text-ink">{batch.coach}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-4">Duration</p>
                    <p className="font-semibold text-ink">{batch.startDate} – {batch.endDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-4">Schedule</p>
                    <p className="font-semibold text-ink">{batch.schedule}</p>
                  </div>
                </div>

                {batch.status === 'active' && (
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-ink-3">Your progress</span>
                      <span className="font-bold text-forest-800">{batch.progress}%</span>
                    </div>
                    <ProgressBar value={batch.progress} size="sm" />
                  </div>
                )}

                <div className="rounded-lg bg-stone-50 px-4 py-3">
                  <p className="text-xs font-semibold text-ink-4 uppercase tracking-wide">Next session</p>
                  <p className="text-sm font-semibold text-ink mt-1">{batch.nextSession}</p>
                </div>

                {batch.batchmates.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-ink-4 mb-2">Batchmates ({batch.studentsCount} total)</p>
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {batch.batchmates.map((m) => (
                          <div
                            key={m.name}
                            title={m.name}
                            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-forest-100 text-[10px] font-bold text-forest-800"
                          >
                            {m.initials}
                          </div>
                        ))}
                      </div>
                      {batch.studentsCount > batch.batchmates.length && (
                        <span className="text-xs text-ink-3">+{batch.studentsCount - batch.batchmates.length} more</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  {batch.status === 'active' && (
                    <>
                      <Button variant="primary" size="sm">View schedule</Button>
                      <Button variant="secondary" size="sm">Message batch</Button>
                    </>
                  )}
                  {batch.status === 'upcoming' && (
                    <Button variant="secondary" size="sm">View orientation details</Button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Panel title="Batch resources" className="mt-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { title: 'Cohort handbook', desc: 'Rules, expectations, and communication guidelines' },
            { title: 'Shared drive', desc: 'Batch documents, templates, and group projects' },
            { title: 'Discussion forum', desc: 'Ask questions and collaborate with batchmates' },
          ].map((r) => (
            <button
              key={r.title}
              type="button"
              className="rounded-lg border border-stone-200 p-4 text-left hover:border-forest-300 hover:bg-forest-50/30 transition-colors"
            >
              <p className="font-semibold text-ink text-sm">{r.title}</p>
              <p className="text-xs text-ink-3 mt-1">{r.desc}</p>
            </button>
          ))}
        </div>
      </Panel>
    </div>
  )
}
