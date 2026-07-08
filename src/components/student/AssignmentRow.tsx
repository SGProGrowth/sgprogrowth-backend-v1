import type { Assignment, AssignmentStatus } from '../../data/studentData'
import { Button } from '../ui/Button'

const statusConfig: Record<AssignmentStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-gold-50 text-gold-700' },
  submitted: { label: 'Submitted', className: 'bg-stone-100 text-ink-2' },
  graded: { label: 'Graded', className: 'bg-forest-50 text-forest-800' },
  overdue: { label: 'Overdue', className: 'bg-red-50 text-red-700' },
}

const typeLabels = {
  project: 'Project',
  essay: 'Essay',
  lab: 'Lab',
  reflection: 'Reflection',
}

interface AssignmentRowProps {
  assignment: Assignment
  onSubmit?: (assignment: Assignment) => void
  onViewFeedback?: (assignment: Assignment) => void
}

export function AssignmentRow({ assignment, onSubmit, onViewFeedback }: AssignmentRowProps) {
  const status = statusConfig[assignment.status]

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:flex-row sm:items-center sm:gap-4 md:p-5 hover:border-stone-300 transition-colors">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-ink-3">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-ink">{assignment.title}</h3>
          <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-ink-3">
            {typeLabels[assignment.type] ?? assignment.type}
          </span>
        </div>
        <p className="text-sm text-ink-3 mt-0.5">{assignment.courseTitle}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <div className="text-left sm:text-right">
          <p className={`text-sm font-semibold ${assignment.status === 'overdue' ? 'text-red-600' : 'text-ink-2'}`}>
            {assignment.dueLabel}
          </p>
          {assignment.score !== undefined && (
            <p className="text-xs text-ink-3 mt-0.5">
              Score: <span className="font-bold text-forest-800">{assignment.score}/{assignment.maxScore}</span>
            </p>
          )}
        </div>
        <span className={`rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${status.className}`}>
          {status.label}
        </span>
        {(assignment.status === 'pending' || assignment.status === 'overdue') && (
          <Button variant="primary" size="sm" onClick={() => onSubmit?.(assignment)}>Submit</Button>
        )}
        {assignment.status === 'submitted' && (
          <Button variant="secondary" size="sm" onClick={() => onSubmit?.(assignment)}>View</Button>
        )}
        {assignment.status === 'graded' && (
          <Button variant="secondary" size="sm" onClick={() => onViewFeedback?.(assignment)}>View feedback</Button>
        )}
      </div>
    </div>
  )
}
