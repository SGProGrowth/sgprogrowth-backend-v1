import { useState } from 'react'
import { useStudentDashboard } from '../../../hooks/useStudentDashboard'
import { PageIntro, TabBar, StatTile } from '../../../components/student/Panel'
import { Button } from '../../../components/ui/Button'
import { Modal } from '../../../components/instructor/Modal'
import { FormField, SelectField, TextAreaField } from '../../../components/instructor/FormField'
import { SuccessBanner } from '../../../components/instructor/Modal'

const typeLabels = { '1:1': '1:1 Coaching', group: 'Group session', 'office-hours': 'Office hours' }

export function StudentCoachingPage() {
  const { workspace } = useStudentDashboard()
  const studentCoachingSessions = workspace?.coachingSessions ?? []
  const [tab, setTab] = useState('upcoming')
  const [showRequest, setShowRequest] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  const upcoming = studentCoachingSessions.filter((s) => s.status === 'upcoming')
  const completed = studentCoachingSessions.filter((s) => s.status === 'completed')

  const tabs = [
    { id: 'upcoming', label: 'Upcoming', count: upcoming.length },
    { id: 'completed', label: 'Completed', count: completed.length },
  ]

  const displayed = tab === 'upcoming' ? upcoming : completed

  const requestSession = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setShowRequest(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }, 1200)
  }

  return (
    <div className="animate-rise">
      <PageIntro
        eyebrow="Coaching"
        title="Live Sessions"
        description="Your scheduled coaching sessions, group reviews, and office hours — the heart of SG Pro Growth learning."
        action={<Button variant="primary" size="md" onClick={() => setShowRequest(true)}>Request session</Button>}
      />

      {saved && <SuccessBanner message="Session request submitted. Your coach will confirm within 24 hours." onDismiss={() => setSaved(false)} />}

      <div className="stat-grid-3 mb-6 sm:mb-8">
        <StatTile label="Upcoming sessions" value={upcoming.length} />
        <StatTile label="Completed this month" value={completed.length} />
        <StatTile label="Coaching hours" value="4.5h" hint="This month" />
      </div>

      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {displayed.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-300 bg-stone-50/50 px-6 py-12 text-center text-sm text-ink-3">
          No sessions in this category.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {displayed.map((s) => (
            <div key={s.id} className="rounded-xl border border-stone-200 bg-white p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="rounded-full bg-forest-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-forest-800">
                    {typeLabels[s.type]}
                  </span>
                  <p className="font-display font-bold text-ink mt-2">{s.title}</p>
                  {s.courseTitle && <p className="text-sm text-ink-3">{s.courseTitle}</p>}
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                  s.status === 'upcoming' ? 'bg-blue-50 text-blue-800' : 'bg-stone-100 text-ink-3'
                }`}>
                  {s.status}
                </span>
              </div>

              <div className="mt-4 space-y-1 text-sm text-ink-2">
                <p>Coach: <span className="font-semibold text-ink">{s.coach}</span></p>
                <p>{s.date} · {s.time} · {s.duration}</p>
                {s.notes && <p className="text-xs text-ink-3 mt-2 italic">{s.notes}</p>}
              </div>

              {s.status === 'upcoming' && (
                <div className="mt-4 flex gap-2">
                  <Button variant="primary" size="sm">Join meeting</Button>
                  <Button variant="ghost" size="sm">Reschedule</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={showRequest}
        onClose={() => setShowRequest(false)}
        title="Request coaching session"
        description="Your coach will review and confirm availability."
        size="lg"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setShowRequest(false)} disabled={loading}>Cancel</button>
            <button type="button" className="btn-primary" onClick={requestSession} disabled={loading}>
              {loading ? 'Submitting…' : 'Submit request'}
            </button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Preferred date" type="date" required />
          <SelectField label="Session type" options={[
            { value: '1:1', label: '1:1 Coaching' },
            { value: 'group', label: 'Group session' },
          ]} />
          <SelectField label="Course (optional)" options={[
            { value: 'aws', label: 'AWS Solutions Architect' },
            { value: 'pm', label: 'IT Project Management' },
            { value: 'general', label: 'General career coaching' },
          ]} />
          <FormField label="Preferred time" type="time" />
          <div className="sm:col-span-2">
            <TextAreaField label="What would you like to discuss?" placeholder="Exam strategy, career roadmap, assignment help…" required />
          </div>
        </div>
      </Modal>
    </div>
  )
}
