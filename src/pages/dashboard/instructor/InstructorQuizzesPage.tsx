import { useEffect, useMemo, useState } from 'react'
import { useInstructorDashboard } from '../../../hooks/useInstructorDashboard'
import { PageIntro, TabBar, StatTile, EmptyState } from '../../../components/dashboard/PageShell'
import { StatusBadge } from '../../../components/instructor/StatusBadge'
import { Modal, ConfirmDialog, SuccessBanner } from '../../../components/instructor/Modal'
import { FormField, SelectField } from '../../../components/instructor/FormField'
import { Button } from '../../../components/ui/Button'

export function InstructorQuizzesPage() {
  const { workspace } = useInstructorDashboard()
  const instructorCourses = workspace?.courses ?? []
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState(workspace?.quizzes ?? [])

  useEffect(() => {
    setItems(workspace?.quizzes ?? [])
  }, [workspace])

  const generic = items.filter((q) => q.isGeneric)
  const courseLinked = items.filter((q) => !q.isGeneric)
  const published = items.filter((q) => q.status === 'published')
  const drafts = items.filter((q) => q.status === 'draft')

  const tabs = [
    { id: 'all', label: 'All quizzes', count: items.length },
    { id: 'generic', label: 'Generic quizzes', count: generic.length },
    { id: 'course', label: 'Course-linked', count: courseLinked.length },
    { id: 'draft', label: 'Drafts', count: drafts.length },
  ]

  const displayed = useMemo(() => {
    let list = tab === 'generic' ? generic : tab === 'course' ? courseLinked : tab === 'draft' ? drafts : items
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((item) => item.title.toLowerCase().includes(q) || item.courseTitle.toLowerCase().includes(q))
    }
    return list
  }, [tab, items, generic, courseLinked, drafts, search])

  const createQuiz = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setShowCreate(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }, 1200)
  }

  return (
    <div className="animate-rise">
      <PageIntro
        eyebrow="Assessments"
        title="Quiz Management"
        description="Create generic platform-wide quizzes or course-specific assessments. Link questions from your question bank."
        action={<Button variant="primary" size="md" onClick={() => setShowCreate(true)}>+ Create quiz</Button>}
      />

      {saved && <SuccessBanner message="Quiz saved successfully." onDismiss={() => setSaved(false)} />}

      <div className="stat-grid mb-6 sm:mb-8">
        <StatTile label="Total quizzes" value={items.length} />
        <StatTile label="Generic quizzes" value={generic.length} hint="Platform-wide assessments" />
        <StatTile label="Published" value={published.length} />
        <StatTile label="Avg. pass rate" value="74%" hint="Across completed attempts" />
      </div>

      <input
        type="search"
        placeholder="Search quizzes…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input-field h-10 w-full max-w-md mb-6"
      />

      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {displayed.length === 0 ? (
        <EmptyState title="No quizzes found" description="Create a generic or course-linked quiz to get started." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayed.map((q) => (
            <article key={q.id} className="rounded-xl border border-stone-200 bg-white p-5 flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <div>
                  {q.isGeneric && (
                    <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-purple-800 border border-purple-200">
                      Generic
                    </span>
                  )}
                  <p className="font-semibold text-ink mt-1">{q.title}</p>
                  <p className="text-sm text-ink-3">{q.courseTitle}</p>
                </div>
                <StatusBadge status={q.status} />
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div><dt className="text-ink-4">Questions</dt><dd className="font-semibold text-ink">{q.questions}</dd></div>
                <div><dt className="text-ink-4">Duration</dt><dd className="font-semibold text-ink">{q.duration}</dd></div>
                <div><dt className="text-ink-4">Attempts</dt><dd className="font-semibold text-ink">{q.attempts} max</dd></div>
                <div><dt className="text-ink-4">Pass score</dt><dd className="font-semibold text-ink">{q.passScore}%</dd></div>
              </dl>

              {q.lastUpdated && <p className="text-[10px] text-ink-4 mt-3">Updated {q.lastUpdated}</p>}

              <div className="mt-auto pt-4 flex gap-2">
                <Button variant="secondary" size="sm">Edit</Button>
                <Button variant="secondary" size="sm">Preview</Button>
                <Button variant="ghost" size="sm" onClick={() => setDeleteId(q.id)}>Delete</Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create quiz"
        description="Generic quizzes can be assigned across multiple courses without being tied to a specific module."
        size="lg"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)} disabled={loading}>Save as draft</button>
            <button type="button" className="btn-primary" onClick={createQuiz} disabled={loading}>
              {loading ? 'Creating…' : 'Create quiz'}
            </button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Quiz title" placeholder="e.g. Cloud Literacy Assessment" required className="sm:col-span-2" />
          <SelectField label="Quiz type" options={[
            { value: 'generic', label: 'Generic (platform-wide)' },
            { value: 'course', label: 'Course-linked' },
          ]} />
          <SelectField label="Course" options={[
            { value: '', label: 'All courses (generic only)' },
            ...instructorCourses.map((c) => ({ value: c.id, label: c.title })),
          ]} />
          <FormField label="Duration" placeholder="e.g. 30 min" required />
          <FormField label="Pass score (%)" type="number" defaultValue="70" required />
          <FormField label="Max attempts" type="number" defaultValue="2" required />
          <FormField label="Number of questions" type="number" defaultValue="20" required className="sm:col-span-2" />
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { setItems((p) => p.filter((q) => q.id !== deleteId)); setDeleteId(null) }}
        title="Delete quiz"
        message="Student attempt history will be preserved but the quiz will no longer be available for new attempts."
        confirmLabel="Delete quiz"
        variant="danger"
      />
    </div>
  )
}
