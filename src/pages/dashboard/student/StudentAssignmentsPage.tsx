import { useCallback, useEffect, useState } from 'react'
import type { Assignment } from '../../../data/studentData'
import {
  downloadAuthenticatedFile,
  fetchAssignment,
  fetchStudentAssignments,
  mapApiAssignmentToStudent,
  submitAssignment,
  type AssignmentDetail,
} from '../../../lib/api/assignments'
import { AssignmentRow } from '../../../components/student/AssignmentRow'
import { Modal } from '../../../components/instructor/Modal'
import { TextAreaField } from '../../../components/instructor/FormField'
import { Button } from '../../../components/ui/Button'
import { PageIntro, TabBar, StatTile } from '../../../components/student/Panel'

export function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('upcoming')
  const [active, setActive] = useState<AssignmentDetail | null>(null)
  const [submitBody, setSubmitBody] = useState('')
  const [submitFiles, setSubmitFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchStudentAssignments({ pageSize: 50 })
      setAssignments(res.data.map(mapApiAssignmentToStudent))
    } catch {
      setAssignments([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const pending = assignments.filter((a) => a.status === 'pending')
  const submitted = assignments.filter((a) => a.status === 'submitted')
  const graded = assignments.filter((a) => a.status === 'graded')
  const overdue = assignments.filter((a) => a.status === 'overdue')

  const tabs = [
    { id: 'upcoming', label: 'Upcoming', count: pending.length },
    { id: 'overdue', label: 'Overdue', count: overdue.length },
    { id: 'graded', label: 'Graded', count: graded.length },
  ]

  const displayed =
    tab === 'upcoming' ? pending
    : tab === 'overdue' ? overdue
    : graded

  const openAssignment = async (assignment: Assignment) => {
    setError('')
    try {
      const detail = await fetchAssignment(assignment.id)
      setActive(detail)
      setSubmitBody(detail.submission?.body ?? '')
      setSubmitFiles([])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load assignment')
    }
  }

  const handleSubmit = async (replace: boolean) => {
    if (!active) return
    setSubmitting(true)
    setError('')
    try {
      await submitAssignment(active.id, { body: submitBody, files: submitFiles }, replace)
      setActive(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  const avgScore =
    graded.length > 0
      ? Math.round(
          graded.reduce((s, a) => s + (a.score ?? 0), 0) /
            graded.filter((a) => a.score != null).length || 0,
        )
      : null

  return (
    <div className="animate-rise">
      <PageIntro
        eyebrow="Coursework"
        title="Assignments"
        description="Submit projects, labs, and reflections on time. Your coach reviews submissions and provides actionable feedback."
      />

      <div className="stat-grid-3 mb-6 sm:mb-8">
        <StatTile label="Pending" value={pending.length} hint="Awaiting submission" />
        <StatTile label="Overdue" value={overdue.length} hint={overdue.length > 0 ? 'Action required' : 'All caught up'} />
        <StatTile label="Average score" value={avgScore != null ? `${avgScore}%` : '—'} hint="On graded assignments" />
      </div>

      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-ink-3 py-8 text-center">Loading assignments…</p>
        ) : displayed.length > 0 ? (
          displayed.map((assignment) => (
            <AssignmentRow
              key={assignment.id}
              assignment={assignment}
              onSubmit={openAssignment}
              onViewFeedback={openAssignment}
            />
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

      <Modal
        open={!!active}
        onClose={() => setActive(null)}
        title={active?.title ?? 'Assignment'}
        size="xl"
        footer={
          active?.submissionStatus === 'graded' || active?.submissionStatus === 'submitted' ? (
            <Button variant="secondary" onClick={() => setActive(null)}>Close</Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setActive(null)} disabled={submitting}>Cancel</Button>
              <Button
                variant="primary"
                onClick={() => void handleSubmit(Boolean(active?.submission?.id))}
                disabled={submitting}
              >
                {submitting ? 'Submitting…' : active?.submission ? 'Replace submission' : 'Submit assignment'}
              </Button>
            </>
          )
        }
      >
        {active && (
          <div className="space-y-4">
            <p className="text-sm text-ink-3">{active.courseTitle} · Due {active.dueDate}</p>
            {active.instructions && (
              <div
                className="prose prose-sm max-w-none text-ink-2"
                dangerouslySetInnerHTML={{ __html: active.instructions }}
              />
            )}
            {active.attachments.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase text-ink-3 mb-2">Resources</p>
                <ul className="space-y-1">
                  {active.attachments.map((file) => (
                    <li key={file.id}>
                      <button
                        type="button"
                        className="text-sm text-forest-800 hover:underline"
                        onClick={() =>
                          void downloadAuthenticatedFile(
                            `/assignments/${active.id}/attachments/${file.id}/download`,
                            file.filename,
                          )
                        }
                      >
                        {file.filename}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {active.submission?.feedback && (
              <div className="rounded-lg bg-forest-50 p-4 text-sm text-ink-2">
                <p className="font-semibold text-forest-900 mb-1">Instructor feedback</p>
                <p>{active.submission.feedback}</p>
                {active.submission.score != null && (
                  <p className="mt-2 font-semibold">Score: {active.submission.score}/{active.maxScore}</p>
                )}
              </div>
            )}
            {active.submissionStatus !== 'graded' && active.submissionStatus !== 'submitted' && (
              <>
                <TextAreaField
                  label="Your response"
                  value={submitBody}
                  onChange={(e) => setSubmitBody(e.target.value)}
                  rows={5}
                  placeholder="Write your submission or notes for the instructor…"
                />
                <div>
                  <label className="block text-sm font-medium text-ink-2 mb-1">Attach files</label>
                  <input
                    type="file"
                    multiple
                    className="block w-full text-sm text-ink-3"
                    onChange={(e) => setSubmitFiles(Array.from(e.target.files ?? []))}
                  />
                  {active.allowedFileTypes.length > 0 && (
                    <p className="text-xs text-ink-4 mt-1">
                      Allowed: {active.allowedFileTypes.join(', ')} · Max{' '}
                      {Math.round(active.maxFileSizeBytes / 1024 / 1024)}MB per file
                    </p>
                  )}
                </div>
              </>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )}
      </Modal>
    </div>
  )
}
