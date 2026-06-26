import { useState } from 'react'
import { gradeEntries } from '../../../data/instructorData'
import { PageIntro, TabBar, StatTile } from '../../../components/dashboard/PageShell'
import { StatusBadge } from '../../../components/instructor/StatusBadge'
import { Modal } from '../../../components/instructor/Modal'
import { FormField } from '../../../components/instructor/FormField'
import { SuccessBanner } from '../../../components/instructor/Modal'
import { Button } from '../../../components/ui/Button'

export function InstructorGradesPage() {
  const [tab, setTab] = useState('pending')
  const [grading, setGrading] = useState<typeof gradeEntries[0] | null>(null)
  const [score, setScore] = useState('')
  const [saved, setSaved] = useState(false)

  const pending = gradeEntries.filter((g) => g.status === 'pending')
  const graded = gradeEntries.filter((g) => g.status === 'graded')
  const late = gradeEntries.filter((g) => g.status === 'late')

  const tabs = [
    { id: 'pending', label: 'Pending review', count: pending.length },
    { id: 'graded', label: 'Graded', count: graded.length },
    { id: 'late', label: 'Late', count: late.length },
  ]

  const displayed = tab === 'pending' ? pending : tab === 'graded' ? graded : late

  const submitGrade = () => {
    setGrading(null)
    setScore('')
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="animate-rise">
      <PageIntro
        eyebrow="Assessment"
        title="Grade Management"
        description="Review submissions, provide coaching feedback, and track learner performance."
      />

      {saved && <SuccessBanner message="Grade saved and student notified." onDismiss={() => setSaved(false)} />}

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatTile label="Pending review" value={pending.length} hint="Awaiting your feedback" />
        <StatTile label="Graded this week" value={graded.length} />
        <StatTile label="Class average" value="88%" hint="Across graded submissions" />
      </div>

      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      <div className="space-y-3">
        {displayed.map((g) => (
          <div key={g.id} className="flex flex-col gap-4 rounded-xl border border-stone-200 bg-white p-5 sm:flex-row sm:items-center">
            <div className="flex-1">
              <p className="font-semibold text-ink">{g.assignmentTitle}</p>
              <p className="text-sm text-ink-3">{g.studentName} · {g.courseTitle}</p>
              <p className="text-xs text-ink-4 mt-1">Submitted {g.submittedDate}</p>
            </div>
            <div className="flex items-center gap-3">
              {g.score !== null && <span className="font-bold text-forest-800">{g.score}/{g.maxScore}</span>}
              <StatusBadge status={g.status} />
              {g.status === 'pending' && (
                <Button variant="primary" size="sm" onClick={() => { setGrading(g); setScore('') }}>Grade</Button>
              )}
              {g.status === 'graded' && <Button variant="secondary" size="sm">View feedback</Button>}
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={!!grading}
        onClose={() => setGrading(null)}
        title="Grade submission"
        description={grading ? `${grading.studentName} — ${grading.assignmentTitle}` : ''}
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setGrading(null)}>Cancel</button>
            <button type="button" className="btn-primary" onClick={submitGrade}>Save grade</button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Score" type="number" min={0} max={grading?.maxScore} value={score} onChange={(e) => setScore(e.target.value)} hint={`Out of ${grading?.maxScore} points`} required />
          <FormField label="Feedback" placeholder="Coaching feedback for the learner…" />
        </div>
      </Modal>
    </div>
  )
}
