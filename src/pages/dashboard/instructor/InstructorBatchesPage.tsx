import { useCallback, useEffect, useMemo, useState } from 'react'
import { useInstructorDashboard } from '../../../hooks/useInstructorDashboard'
import { PageIntro, TabBar, StatTile, EmptyState } from '../../../components/dashboard/PageShell'
import { StatusBadge } from '../../../components/instructor/StatusBadge'
import { Modal, SuccessBanner } from '../../../components/instructor/Modal'
import { FormField, SelectField } from '../../../components/instructor/FormField'
import { Button } from '../../../components/ui/Button'
import { ProgressBar } from '../../../components/student/ProgressBar'
import { Link } from 'react-router-dom'
import { UploadZone } from '../../../components/instructor/UploadZone'
import { uploadBatchThumbnail } from '../../../lib/api/media'
import {
  createBatch,
  fetchInstructorBatches,
  type BatchRecord,
} from '../../../lib/api/batches'

export function InstructorBatchesPage() {
  const { workspace, profile, refresh } = useInstructorDashboard()
  const instructorCourses = workspace?.courses ?? []
  const [batches, setBatches] = useState<BatchRecord[]>([])
  const [tab, setTab] = useState('active')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    courseSlug: instructorCourses[0]?.id ?? '',
    maxCapacity: '30',
    startDate: '',
    endDate: '',
    schedule: '',
    publish: true,
  })

  const loadBatches = useCallback(() => {
    fetchInstructorBatches()
      .then(setBatches)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load batches'))
  }, [])

  useEffect(() => {
    loadBatches()
  }, [loadBatches])

  useEffect(() => {
    if (instructorCourses.length && !form.courseSlug) {
      setForm((f) => ({ ...f, courseSlug: instructorCourses[0].id }))
    }
  }, [instructorCourses, form.courseSlug])

  const active = batches.filter((b) => b.status === 'active')
  const upcoming = batches.filter((b) => b.status === 'upcoming')
  const completed = batches.filter((b) => b.status === 'completed')
  const draft = batches.filter((b) => b.status === 'draft')

  const tabs = [
    { id: 'active', label: 'Active', count: active.length },
    { id: 'upcoming', label: 'Upcoming', count: upcoming.length },
    { id: 'completed', label: 'Completed', count: completed.length },
    { id: 'draft', label: 'Drafts', count: draft.length },
  ]

  const displayed = useMemo(() => {
    let list = tab === 'active' ? active : tab === 'upcoming' ? upcoming : tab === 'completed' ? completed : draft
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((b) => b.name.toLowerCase().includes(q) || b.courseTitle.toLowerCase().includes(q))
    }
    return list
  }, [tab, active, upcoming, completed, draft, search])

  const avgCompletion =
    active.length > 0
      ? Math.round(active.reduce((s, b) => s + b.completionRate, 0) / active.length)
      : 0

  const handleCreate = async (asDraft = false) => {
    if (!form.name.trim() || !form.courseSlug || !form.startDate) {
      setError('Batch name, course, and start date are required.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await createBatch({
        name: form.name.trim(),
        courseSlug: form.courseSlug,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        schedule: form.schedule || undefined,
        maxCapacity: Number(form.maxCapacity) || 30,
        publish: asDraft ? false : form.publish,
      })
      setShowCreate(false)
      setSaved(true)
      setForm({
        name: '',
        courseSlug: instructorCourses[0]?.id ?? '',
        maxCapacity: '30',
        startDate: '',
        endDate: '',
        schedule: '',
        publish: true,
      })
      loadBatches()
      refresh()
      setTimeout(() => setSaved(false), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create batch')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-rise">
      <PageIntro
        eyebrow="Cohorts"
        title="Batch Management"
        description="Organize learners into cohorts with shared schedules, capacity limits, and group sessions."
        action={
          <div className="flex gap-2">
            <Link to="/instructor/students/import">
              <Button variant="secondary" size="md">Bulk enroll students</Button>
            </Link>
            <Button variant="primary" size="md" onClick={() => setShowCreate(true)}>+ Create batch</Button>
          </div>
        }
      />

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </div>
      )}

      {saved && <SuccessBanner message="Batch created successfully." onDismiss={() => setSaved(false)} />}

      <div className="stat-grid mb-6 sm:mb-8">
        <StatTile label="Active batches" value={active.length} />
        <StatTile label="Total enrolled" value={batches.reduce((s, b) => s + b.studentsCount, 0)} />
        <StatTile label="Avg. completion" value={`${avgCompletion}%`} hint="Active batches" />
        <StatTile label="Upcoming intakes" value={upcoming.length} />
      </div>

      <input
        type="search"
        placeholder="Search batches…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input-field h-10 w-full max-w-md mb-6"
      />

      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {displayed.length === 0 ? (
        <EmptyState title="No batches found" description="Create a batch to organize cohort-based enrollments." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {displayed.map((b) => {
            const capacityPct = b.maxCapacity > 0 ? Math.round((b.studentsCount / b.maxCapacity) * 100) : 0
            return (
              <article key={b.id} className="rounded-xl border border-stone-200 bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-24 shrink-0">
                    <UploadZone
                      label=""
                      aspect="square"
                      previewUrl={b.thumbnailUrl ?? undefined}
                      uploadFn={async (file, onProgress) => {
                        await uploadBatchThumbnail(b.id, file, onProgress)
                        loadBatches()
                      }}
                    />
                  </div>
                  <div className="flex flex-1 items-start justify-between gap-2 min-w-0">
                  <div>
                    <p className="text-xs text-ink-4">{b.courseTitle}</p>
                    <h3 className="font-display font-bold text-ink mt-0.5">{b.name}</h3>
                    <p className="text-[10px] font-mono text-ink-4 mt-0.5">{b.batchCode}</p>
                  </div>
                  <StatusBadge status={b.status} />
                  </div>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div><dt className="text-xs text-ink-4">Instructor</dt><dd className="font-semibold">{profile?.name ?? '—'}</dd></div>
                  <div><dt className="text-xs text-ink-4">Schedule</dt><dd className="font-semibold">{b.schedule}</dd></div>
                  <div><dt className="text-xs text-ink-4">Start</dt><dd className="font-semibold">{b.startDate}</dd></div>
                  <div><dt className="text-xs text-ink-4">End</dt><dd className="font-semibold">{b.endDate}</dd></div>
                </dl>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-ink-3">Enrollment: {b.studentsCount}/{b.maxCapacity}</span>
                    <span className="font-semibold text-forest-800">{capacityPct}%</span>
                  </div>
                  <ProgressBar value={capacityPct} size="sm" />
                </div>

                {b.status === 'active' && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-ink-3">Avg. completion</span>
                      <span className="font-semibold">{b.completionRate}%</span>
                    </div>
                    <ProgressBar value={b.completionRate} size="sm" />
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm">Manage students</Button>
                  <Button variant="secondary" size="sm">Edit schedule</Button>
                  <Link to="/instructor/students/import">
                    <Button variant="ghost" size="sm">Add students</Button>
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create batch"
        size="lg"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => handleCreate(true)} disabled={loading}>Save as draft</button>
            <button type="button" className="btn-primary" onClick={() => handleCreate(false)} disabled={loading}>
              {loading ? 'Creating…' : 'Create batch'}
            </button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Batch name"
            placeholder="e.g. AWS SAA — September 2026"
            required
            className="sm:col-span-2"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <SelectField
            label="Course"
            value={form.courseSlug}
            onChange={(e) => setForm((f) => ({ ...f, courseSlug: e.target.value }))}
            options={instructorCourses.map((c) => ({ value: c.id, label: c.title }))}
          />
          <FormField
            label="Max capacity"
            type="number"
            required
            value={form.maxCapacity}
            onChange={(e) => setForm((f) => ({ ...f, maxCapacity: e.target.value }))}
          />
          <FormField
            label="Start date"
            type="date"
            required
            value={form.startDate}
            onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
          />
          <FormField
            label="End date"
            type="date"
            value={form.endDate}
            onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
          />
          <FormField
            label="Schedule"
            placeholder="e.g. Tue & Thu · 6:00–8:00 PM IST"
            required
            className="sm:col-span-2"
            value={form.schedule}
            onChange={(e) => setForm((f) => ({ ...f, schedule: e.target.value }))}
          />
        </div>
      </Modal>
    </div>
  )
}
