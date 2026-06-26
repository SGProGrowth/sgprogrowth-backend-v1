import { useState } from 'react'
import { assignments, getPendingAssignments } from '../../../data/studentData'
import { AssignmentRow } from '../../../components/student/AssignmentRow'
import { PageIntro, TabBar, StatTile } from '../../../components/student/Panel'

export function StudentAssignmentsPage() {
  const [tab, setTab] = useState('upcoming')
  const pending = getPendingAssignments()
  const submitted = assignments.filter((a) => a.status === 'submitted')
  const graded = assignments.filter((a) => a.status === 'graded')
  const overdue = assignments.filter((a) => a.status === 'overdue')

  const tabs = [
    { id: 'upcoming', label: 'Upcoming', count: pending.length },
    { id: 'overdue', label: 'Overdue', count: overdue.length },
    { id: 'graded', label: 'Graded', count: graded.length },
  ]

  const displayed =
    tab === 'upcoming' ? pending.filter((a) => a.status === 'pending')
    : tab === 'overdue' ? overdue
    : graded

  return (
    <div className="animate-rise">
      <PageIntro
        eyebrow="Coursework"
        title="Assignments"
        description="Submit projects, labs, and reflections on time. Your coach reviews submissions and provides actionable feedback."
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatTile label="Pending" value={pending.length} hint="Awaiting submission" />
        <StatTile label="Overdue" value={overdue.length} hint={overdue.length > 0 ? 'Action required' : 'All caught up'} />
        <StatTile label="Average score" value="96%" hint="On graded assignments" />
      </div>

      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      <div className="space-y-3">
        {displayed.length > 0 ? (
          displayed.map((assignment) => (
            <AssignmentRow key={assignment.id} assignment={assignment} />
          ))
        ) : (
          <p className="rounded-xl border border-dashed border-stone-300 bg-stone-50/50 px-6 py-12 text-center text-sm text-ink-3">
            No assignments in this category.
          </p>
        )}
      </div>

      {submitted.length > 0 && tab === 'upcoming' && (
        <p className="mt-6 text-xs text-ink-3">
          {submitted.length} assignment(s) awaiting grading.
        </p>
      )}
    </div>
  )
}
