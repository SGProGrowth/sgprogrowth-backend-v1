import { useCallback, useEffect, useMemo, useState } from 'react'
import type { InstructorAssignment } from '../../../data/instructorData'
import { useInstructorDashboard } from '../../../hooks/useInstructorDashboard'
import {
  createAssignment,
  deleteAssignment,
  fetchInstructorAssignments,
  fetchSubmissions,
  gradeSubmission,
  publishAssignment,
  type InstructorSubmission,
} from '../../../lib/api/assignments'
import { PageIntro, TabBar, StatTile, EmptyState } from '../../../components/dashboard/PageShell'
import { StatusBadge } from '../../../components/instructor/StatusBadge'
import { Modal, ConfirmDialog, SuccessBanner } from '../../../components/instructor/Modal'
import { FormField, SelectField, TextAreaField, ToggleField } from '../../../components/instructor/FormField'
import { Button } from '../../../components/ui/Button'
import { ProgressBar } from '../../../components/student/ProgressBar'

const typeOptions = [
  { value: 'project', label: 'Project' },
  { value: 'essay', label: 'Essay' },
  { value: 'lab', label: 'Lab' },
  { value: 'reflection', label: 'Reflection' },
]

export function InstructorAssignmentsPage() {
  const { workspace } = useInstructorDashboard()
  const instructorCourses = workspace?.courses ?? []
  const [tab, setTab] = useState('published')
  const [search, setSearch] = useState('')
  const [courseFilter, setCourseFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<InstructorAssignment[]>([])
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '',
    courseSlug: instructorCourses[0]?.id ?? '',
    type: 'project',
    dueAt: '',
    maxScore: '100',
    instructions: '',
    allowLate: false,
    allowResubmission: false,
  })

  const [submissionsFor, setSubmissionsFor] = useState<InstructorAssignment | null>(null)
  const [submissions, setSubmissions] = useState<InstructorSubmission[]>([])
  const [gradeForm, setGradeForm] = useState({ score: '', feedback: '' })
  const [activeSubmission, setActiveSubmission] = useState<InstructorSubmission | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchInstructorAssignments({
        pageSize: 50,
        q: search.trim() || undefined,
        course: courseFilter !== 'all' ? courseFilter : undefined,
        status: tab === 'published' ? 'published' : tab === 'draft' ? 'draft' : undefined,
      })
      setItems(res.data)
    } catch {
      setItems(workspace?.assignments ?? [])
    } finally {
      setLoading(false)
    }
  }, [search, courseFilter, tab, workspace?.assignments])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (instructorCourses.length && !form.courseSlug) {
      setForm((f) => ({ ...f, courseSlug: instructorCourses[0].id }))
    }
  }, [instructorCourses, form.courseSlug])

  const published = items.filter((a) => a.status === 'published')
  const drafts = items.filter((a) => a.status === 'draft')

  const tabs = [
    { id: 'published', label: 'Published', count: published.length },
    { id: 'draft', label: 'Drafts', count: drafts.length },
  ]

  const displayed = useMemo(() => {
    let list = tab === 'published' ? published : drafts
    if (courseFilter !== 'all') list = list.filter((a) => a.courseId === courseFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((a) => a.title.toLowerCase().includes(q) || a.courseTitle.toLowerCase().includes(q))
    }
    return list
  }, [tab, published, drafts, courseFilter, search])

  const resetForm = () => {
    setForm({
      title: '',
      courseSlug: instructorCourses[0]?.id ?? '',
      type: 'project',
      dueAt: '',
      maxScore: '100',
      instructions: '',
      allowLate: false,
      allowResubmission: false,
    })
    setError('')
  }

  const saveAssignment = async (publish: boolean) => {
    setLoading(true)
    setError('')
    try {
      const created = await createAssignment({
        title: form.title,
        courseSlug: form.courseSlug,
        type: form.type,
        instructions: form.instructions,
        dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : undefined,
        maxScore: Number(form.maxScore) || 100,
        allowLate: form.allowLate,
        allowResubmission: form.allowResubmission,
        allowedFileTypes: ['pdf', 'docx', 'png', 'jpg'],
      })
      if (publish) await publishAssignment(created.id)
      setShowCreate(false)
      resetForm()
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save assignment')
    } finally {
      setLoading(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    try {
      await deleteAssignment(deleteId)
      setDeleteId(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  const openSubmissions = async (assignment: InstructorAssignment) => {
    setSubmissionsFor(assignment)
    setActiveSubmission(null)
    setGradeForm({ score: '', feedback: '' })
    try {
      const res = await fetchSubmissions(assignment.id)
      setSubmissions(res.data)
    } catch {
      setSubmissions([])
    }
  }

  const submitGrade = async (returnToStudent = false) => {
    if (!submissionsFor || !activeSubmission) return
    setLoading(true)
    try {
      await gradeSubmission(submissionsFor.id, activeSubmission.id, {
        score: Number(gradeForm.score),
        feedback: gradeForm.feedback,
        returnToStudent,
      })
      const res = await fetchSubmissions(submissionsFor.id)
      setSubmissions(res.data)
      setActiveSubmission(null)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Grading failed')
    } finally {
      setLoading(false)
    }
  }

  const pendingCount = published.reduce(
    (s, a) => s + Math.max(0, (a.totalStudents ?? 0) - (a.submissions ?? 0)),
    0,
  )

  return (
    <div className="animate-rise">
      <PageIntro
        eyebrow="Coursework"
        title="Assignment Management"
        description="Create, schedule, and track assignments across all your courses."
        action={<Button variant="primary" size="md" onClick={() => { resetForm(); setShowCreate(true) }}>+ Create assignment</Button>}
      />

      {saved && <SuccessBanner message="Assignment saved successfully." onDismiss={() => setSaved(false)} />}
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="stat-grid mb-6 sm:mb-8">
        <StatTile label="Published" value={published.length} />
        <StatTile label="Drafts" value={drafts.length} />
        <StatTile label="Pending submissions" value={pendingCount} hint="Awaiting student work" />
        <StatTile
          label="Avg. submission rate"
          value={
            published.length
              ? `${Math.round(
                  published.reduce((s, a) => {
                    const rate = a.totalStudents ? ((a.submissions ?? 0) / a.totalStudents) * 100 : 0
                    return s + rate
                  }, 0) / published.length,
                )}%`
              : '—'
          }
          hint="Across published assignments"
        />
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          placeholder="Search assignments…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field h-10 flex-1 max-w-md"
        />
        <select
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          className="input-field h-10 w-full sm:w-auto"
        >
          <option value="all">All courses</option>
          {instructorCourses.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>

      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {loading && !displayed.length ? (
        <p className="text-sm text-ink-3 py-8 text-center">Loading assignments…</p>
      ) : displayed.length === 0 ? (
        <EmptyState title="No assignments found" description="Create your first assignment or adjust filters." />
      ) : (
        <div className="space-y-3">
          {displayed.map((a) => {
            const submissionRate = a.totalStudents
              ? Math.round(((a.submissions ?? 0) / a.totalStudents) * 100)
              : 0
            return (
              <div key={a.id} className="rounded-xl border border-stone-200 bg-white p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-ink">{a.title}</p>
                      <StatusBadge status={a.status} />
                      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-ink-3">{a.type}</span>
                    </div>
                    <p className="text-sm text-ink-3 mt-1">{a.courseTitle} · Due {a.dueDate}</p>
                    <p className="text-xs text-ink-4 mt-1">Max score: {a.maxScore} · {a.allowLate ? 'Late submissions allowed' : 'No late submissions'}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {a.status === 'draft' && (
                      <Button variant="primary" size="sm" onClick={() => void publishAssignment(a.id).then(load)}>Publish</Button>
                    )}
                    <Button variant="secondary" size="sm" onClick={() => void openSubmissions(a)}>View submissions</Button>
                    {a.status === 'draft' && (
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(a.id)}>Delete</Button>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-ink-3">Submissions: {a.submissions ?? 0}/{a.totalStudents ?? 0}</span>
                    <span className="font-semibold text-forest-800">{submissionRate}%</span>
                  </div>
                  <ProgressBar value={submissionRate} size="sm" />
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create assignment"
        size="xl"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => void saveAssignment(false)} disabled={loading}>Save as draft</button>
            <button type="button" className="btn-primary" onClick={() => void saveAssignment(true)} disabled={loading}>
              {loading ? 'Publishing…' : 'Publish assignment'}
            </button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Assignment title"
            placeholder="e.g. VPC Architecture Design"
            required
            className="sm:col-span-2"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <SelectField
            label="Course"
            options={instructorCourses.map((c) => ({ value: c.id, label: c.title }))}
            value={form.courseSlug}
            onChange={(e) => setForm((f) => ({ ...f, courseSlug: e.target.value }))}
          />
          <SelectField
            label="Type"
            options={typeOptions}
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
          />
          <FormField
            label="Due date"
            type="datetime-local"
            required
            value={form.dueAt}
            onChange={(e) => setForm((f) => ({ ...f, dueAt: e.target.value }))}
          />
          <FormField
            label="Max score"
            type="number"
            required
            value={form.maxScore}
            onChange={(e) => setForm((f) => ({ ...f, maxScore: e.target.value }))}
          />
          <div className="sm:col-span-2">
            <TextAreaField
              label="Instructions"
              placeholder="Describe the assignment requirements, rubric, and submission format…"
              rows={5}
              required
              value={form.instructions}
              onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <ToggleField
              label="Allow late submissions"
              checked={form.allowLate}
              onChange={(checked) => setForm((f) => ({ ...f, allowLate: checked }))}
            />
            <ToggleField
              label="Allow resubmissions"
              checked={form.allowResubmission}
              onChange={(checked) => setForm((f) => ({ ...f, allowResubmission: checked }))}
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={!!submissionsFor}
        onClose={() => { setSubmissionsFor(null); setActiveSubmission(null) }}
        title={submissionsFor ? `Submissions — ${submissionsFor.title}` : 'Submissions'}
        size="xl"
        footer={<Button variant="secondary" onClick={() => setSubmissionsFor(null)}>Close</Button>}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {submissions.length === 0 ? (
              <p className="text-sm text-ink-3">No submissions yet.</p>
            ) : (
              submissions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setActiveSubmission(s)
                    setGradeForm({ score: String(s.score ?? ''), feedback: s.feedback ?? '' })
                  }}
                  className={`w-full rounded-lg border p-3 text-left text-sm ${
                    activeSubmission?.id === s.id ? 'border-forest-600 bg-forest-50' : 'border-stone-200'
                  }`}
                >
                  <p className="font-semibold text-ink">{s.studentName}</p>
                  <p className="text-ink-3">{s.status} · {s.submittedAt ?? 'Not submitted'}</p>
                </button>
              ))
            )}
          </div>
          {activeSubmission && (
            <div className="space-y-3">
              <p className="font-semibold text-ink">{activeSubmission.studentName}</p>
              {activeSubmission.body && <p className="text-sm text-ink-2 whitespace-pre-wrap">{activeSubmission.body}</p>}
              {activeSubmission.files.length > 0 && (
                <ul className="text-sm text-forest-800">
                  {activeSubmission.files.map((f) => (
                    <li key={f.id}>{f.filename}</li>
                  ))}
                </ul>
              )}
              <FormField
                label="Score"
                type="number"
                value={gradeForm.score}
                onChange={(e) => setGradeForm((g) => ({ ...g, score: e.target.value }))}
              />
              <TextAreaField
                label="Feedback"
                rows={4}
                value={gradeForm.feedback}
                onChange={(e) => setGradeForm((g) => ({ ...g, feedback: e.target.value }))}
              />
              <div className="flex flex-wrap gap-2">
                <Button variant="primary" size="sm" onClick={() => void submitGrade(false)} disabled={loading}>Grade</Button>
                <Button variant="secondary" size="sm" onClick={() => void submitGrade(true)} disabled={loading}>Return for revision</Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => void confirmDelete()}
        title="Delete assignment"
        message="This will permanently remove the draft assignment. This action cannot be undone."
        confirmLabel="Delete assignment"
        variant="danger"
      />
    </div>
  )
}
