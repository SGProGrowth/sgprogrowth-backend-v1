import { useEffect, useMemo, useState } from 'react'
import { useInstructorDashboard } from '../../../hooks/useInstructorDashboard'
import { PageIntro, TabBar, StatTile, EmptyState } from '../../../components/dashboard/PageShell'
import { StatusBadge } from '../../../components/instructor/StatusBadge'
import { Modal, ConfirmDialog, SuccessBanner } from '../../../components/instructor/Modal'
import { FormField, SelectField, TextAreaField } from '../../../components/instructor/FormField'
import { Button } from '../../../components/ui/Button'
import { ProgressBar } from '../../../components/student/ProgressBar'

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
  const [items, setItems] = useState(workspace?.assignments ?? [])

  useEffect(() => {
    setItems(workspace?.assignments ?? [])
  }, [workspace])

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

  const createAssignment = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setShowCreate(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }, 1200)
  }

  const confirmDelete = () => {
    if (deleteId) setItems((prev) => prev.filter((a) => a.id !== deleteId))
    setDeleteId(null)
  }

  return (
    <div className="animate-rise">
      <PageIntro
        eyebrow="Coursework"
        title="Assignment Management"
        description="Create, schedule, and track assignments across all your courses."
        action={<Button variant="primary" size="md" onClick={() => setShowCreate(true)}>+ Create assignment</Button>}
      />

      {saved && <SuccessBanner message="Assignment saved successfully." onDismiss={() => setSaved(false)} />}

      <div className="stat-grid mb-6 sm:mb-8">
        <StatTile label="Published" value={published.length} />
        <StatTile label="Drafts" value={drafts.length} />
        <StatTile label="Pending submissions" value={published.reduce((s, a) => s + (a.totalStudents - a.submissions), 0)} hint="Awaiting student work" />
        <StatTile label="Avg. submission rate" value="62%" hint="Across published assignments" />
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

      {displayed.length === 0 ? (
        <EmptyState title="No assignments found" description="Create your first assignment or adjust filters." />
      ) : (
        <div className="space-y-3">
          {displayed.map((a) => {
            const submissionRate = Math.round((a.submissions / a.totalStudents) * 100)
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
                    <Button variant="secondary" size="sm">Edit</Button>
                    <Button variant="secondary" size="sm">View submissions</Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteId(a.id)}>Delete</Button>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-ink-3">Submissions: {a.submissions}/{a.totalStudents}</span>
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
            <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)} disabled={loading}>Save as draft</button>
            <button type="button" className="btn-primary" onClick={createAssignment} disabled={loading}>
              {loading ? 'Publishing…' : 'Publish assignment'}
            </button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Assignment title" placeholder="e.g. VPC Architecture Design" required className="sm:col-span-2" />
          <SelectField label="Course" options={instructorCourses.map((c) => ({ value: c.id, label: c.title }))} />
          <SelectField label="Type" options={[
            { value: 'project', label: 'Project' },
            { value: 'essay', label: 'Essay' },
            { value: 'lab', label: 'Lab' },
            { value: 'reflection', label: 'Reflection' },
          ]} />
          <FormField label="Due date" type="date" required />
          <FormField label="Max score" type="number" defaultValue="100" required />
          <div className="sm:col-span-2">
            <TextAreaField label="Instructions" placeholder="Describe the assignment requirements, rubric, and submission format…" rows={5} required />
          </div>
          <label className="sm:col-span-2 flex items-center gap-2 text-sm text-ink-2">
            <input type="checkbox" className="rounded border-stone-300" defaultChecked />
            Allow late submissions
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete assignment"
        message="This will permanently remove the assignment and all associated submissions. This action cannot be undone."
        confirmLabel="Delete assignment"
        variant="danger"
      />
    </div>
  )
}
