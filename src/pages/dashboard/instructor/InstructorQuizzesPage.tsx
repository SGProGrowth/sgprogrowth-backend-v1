import { useCallback, useEffect, useMemo, useState } from 'react'
import type { InstructorQuiz } from '../../../data/instructorData'
import { useInstructorDashboard } from '../../../hooks/useInstructorDashboard'
import { fetchQuestions } from '../../../lib/api/questions'
import {
  createQuiz,
  deleteQuiz,
  fetchInstructorQuizzes,
  fetchQuizAnalytics,
  generateQuizQuestions,
  publishQuiz,
  setQuizQuestions,
  unpublishQuiz,
} from '../../../lib/api/quizzes'
import { PageIntro, TabBar, StatTile, EmptyState } from '../../../components/dashboard/PageShell'
import { StatusBadge } from '../../../components/instructor/StatusBadge'
import { Modal, ConfirmDialog, SuccessBanner } from '../../../components/instructor/Modal'
import { FormField, SelectField, TextAreaField, ToggleField } from '../../../components/instructor/FormField'
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
  const [error, setError] = useState('')
  const [items, setItems] = useState<InstructorQuiz[]>([])
  const [analyticsFor, setAnalyticsFor] = useState<InstructorQuiz | null>(null)
  const [analytics, setAnalytics] = useState<Awaited<ReturnType<typeof fetchQuizAnalytics>> | null>(null)
  const [builderFor, setBuilderFor] = useState<InstructorQuiz | null>(null)
  const [bankQuestions, setBankQuestions] = useState<Array<{ id: string; question: string }>>([])
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([])

  const [form, setForm] = useState({
    title: '',
    quizType: 'course' as 'generic' | 'course',
    courseSlug: instructorCourses[0]?.id ?? '',
    description: '',
    instructions: '',
    durationMinutes: '30',
    unlimitedDuration: false,
    maxAttempts: '3',
    passScore: '70',
    randomizeQuestions: false,
    randomizeOptions: false,
    negativeMarking: false,
    showScoreImmediately: true,
    showCorrectAnswers: false,
    showExplanations: false,
  })

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetchInstructorQuizzes({
        pageSize: 100,
        q: search.trim() || undefined,
        status: tab === 'draft' ? 'draft' : tab === 'published' ? 'published' : undefined,
        generic: tab === 'generic' ? true : tab === 'course' ? false : undefined,
      })
      setItems(res.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load quizzes')
      setItems(workspace?.quizzes ?? [])
    } finally {
      setLoading(false)
    }
  }, [search, tab, workspace?.quizzes])

  useEffect(() => {
    void load()
  }, [load])

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

  const saveQuiz = async () => {
    setLoading(true)
    setError('')
    try {
      const created = await createQuiz({
        title: form.title,
        description: form.description || undefined,
        instructions: form.instructions || undefined,
        isGeneric: form.quizType === 'generic',
        courseSlug: form.quizType === 'course' ? form.courseSlug : undefined,
        durationMinutes: Number(form.durationMinutes) || 30,
        unlimitedDuration: form.unlimitedDuration,
        maxAttempts: Number(form.maxAttempts) || 3,
        passScore: Number(form.passScore) || 70,
        randomizeQuestions: form.randomizeQuestions,
        randomizeOptions: form.randomizeOptions,
        negativeMarking: form.negativeMarking,
        showScoreImmediately: form.showScoreImmediately,
        showCorrectAnswers: form.showCorrectAnswers,
        showExplanations: form.showExplanations,
      })
      setShowCreate(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      await load()
      setBuilderFor(created)
      const bank = await fetchQuestions({ pageSize: 50, status: 'active' })
      setBankQuestions(bank.data.map((q) => ({ id: q.id, question: q.question })))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create quiz')
    } finally {
      setLoading(false)
    }
  }

  const openBuilder = async (quiz: InstructorQuiz) => {
    setBuilderFor(quiz)
    setSelectedQuestionIds([])
    try {
      const bank = await fetchQuestions({ pageSize: 50, status: 'active' })
      setBankQuestions(bank.data.map((q) => ({ id: q.id, question: q.question })))
    } catch {
      setBankQuestions([])
    }
  }

  const saveQuestions = async () => {
    if (!builderFor) return
    setLoading(true)
    try {
      await setQuizQuestions(
        builderFor.id,
        selectedQuestionIds.map((questionId, i) => ({ questionId, sortOrder: i + 1 })),
      )
      setBuilderFor(null)
      setSaved(true)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save questions')
    } finally {
      setLoading(false)
    }
  }

  const randomizeFromBank = async () => {
    if (!builderFor) return
    setLoading(true)
    try {
      await generateQuizQuestions(builderFor.id, {
        mode: 'random',
        count: Math.min(5, bankQuestions.length),
        replaceExisting: true,
      })
      setBuilderFor(null)
      setSaved(true)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate questions')
    } finally {
      setLoading(false)
    }
  }

  const openAnalytics = async (quiz: InstructorQuiz) => {
    setAnalyticsFor(quiz)
    try {
      const data = await fetchQuizAnalytics(quiz.id)
      setAnalytics(data)
    } catch {
      setAnalytics(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteQuiz(deleteId)
      setDeleteId(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  const avgPassRate = analytics?.passRate ?? (published.length ? '—' : '—')

  return (
    <div className="animate-rise">
      <PageIntro
        eyebrow="Assessments"
        title="Quiz Management"
        description="Create generic platform-wide quizzes or course-specific assessments. Link questions from your question bank."
        action={<Button variant="primary" size="md" onClick={() => setShowCreate(true)}>+ Create quiz</Button>}
      />

      {saved && <SuccessBanner message="Quiz saved successfully." onDismiss={() => setSaved(false)} />}
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="stat-grid mb-6 sm:mb-8">
        <StatTile label="Total quizzes" value={items.length} />
        <StatTile label="Generic quizzes" value={generic.length} hint="Platform-wide assessments" />
        <StatTile label="Published" value={published.length} />
        <StatTile label="Avg. pass rate" value={typeof avgPassRate === 'number' ? `${avgPassRate}%` : avgPassRate} hint="Selected quiz analytics" />
      </div>

      <input
        type="search"
        placeholder="Search quizzes…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input-field h-10 w-full max-w-md mb-6"
      />

      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {loading && !displayed.length ? (
        <p className="text-sm text-ink-3 py-8 text-center">Loading quizzes…</p>
      ) : displayed.length === 0 ? (
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
                <StatusBadge status={q.status === 'archived' ? 'draft' : q.status} />
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div><dt className="text-ink-4">Questions</dt><dd className="font-semibold text-ink">{q.questions}</dd></div>
                <div><dt className="text-ink-4">Duration</dt><dd className="font-semibold text-ink">{q.duration}</dd></div>
                <div><dt className="text-ink-4">Attempts</dt><dd className="font-semibold text-ink">{q.attempts} max</dd></div>
                <div><dt className="text-ink-4">Pass score</dt><dd className="font-semibold text-ink">{q.passScore}%</dd></div>
              </dl>

              {q.lastUpdated && <p className="text-[10px] text-ink-4 mt-3">Updated {q.lastUpdated}</p>}

              <div className="mt-auto pt-4 flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={() => void openBuilder(q)}>Questions</Button>
                {q.status === 'draft' && (
                  <Button variant="secondary" size="sm" onClick={() => void publishQuiz(q.id).then(load)}>Publish</Button>
                )}
                {q.status === 'published' && (
                  <Button variant="ghost" size="sm" onClick={() => void unpublishQuiz(q.id).then(load)}>Unpublish</Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => void openAnalytics(q)}>Analytics</Button>
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
            <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)} disabled={loading}>Cancel</button>
            <button type="button" className="btn-primary" onClick={() => void saveQuiz()} disabled={loading}>
              {loading ? 'Creating…' : 'Create quiz'}
            </button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Quiz title" placeholder="e.g. Cloud Literacy Assessment" required className="sm:col-span-2" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <SelectField label="Quiz type" options={[
            { value: 'generic', label: 'Generic (platform-wide)' },
            { value: 'course', label: 'Course-linked' },
          ]} value={form.quizType} onChange={(e) => setForm((f) => ({ ...f, quizType: e.target.value as 'generic' | 'course' }))} />
          <SelectField label="Course" options={[
            { value: '', label: 'Select course' },
            ...instructorCourses.map((c) => ({ value: c.id, label: c.title })),
          ]} value={form.courseSlug} onChange={(e) => setForm((f) => ({ ...f, courseSlug: e.target.value }))} disabled={form.quizType === 'generic'} />
          <FormField label="Duration (minutes)" type="number" required value={form.durationMinutes} onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))} />
          <FormField label="Pass score (%)" type="number" required value={form.passScore} onChange={(e) => setForm((f) => ({ ...f, passScore: e.target.value }))} />
          <FormField label="Max attempts" type="number" required value={form.maxAttempts} onChange={(e) => setForm((f) => ({ ...f, maxAttempts: e.target.value }))} />
          <TextAreaField label="Description" className="sm:col-span-2" rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <TextAreaField label="Instructions" className="sm:col-span-2" rows={3} value={form.instructions} onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))} />
          <ToggleField label="Unlimited duration" checked={form.unlimitedDuration} onChange={(v) => setForm((f) => ({ ...f, unlimitedDuration: v }))} />
          <ToggleField label="Randomize questions" checked={form.randomizeQuestions} onChange={(v) => setForm((f) => ({ ...f, randomizeQuestions: v }))} />
          <ToggleField label="Randomize options" checked={form.randomizeOptions} onChange={(v) => setForm((f) => ({ ...f, randomizeOptions: v }))} />
          <ToggleField label="Negative marking" checked={form.negativeMarking} onChange={(v) => setForm((f) => ({ ...f, negativeMarking: v }))} />
          <ToggleField label="Show score immediately" checked={form.showScoreImmediately} onChange={(v) => setForm((f) => ({ ...f, showScoreImmediately: v }))} />
          <ToggleField label="Show correct answers" checked={form.showCorrectAnswers} onChange={(v) => setForm((f) => ({ ...f, showCorrectAnswers: v }))} />
          <ToggleField label="Show explanations" checked={form.showExplanations} onChange={(v) => setForm((f) => ({ ...f, showExplanations: v }))} />
        </div>
      </Modal>

      <Modal
        open={!!builderFor}
        onClose={() => setBuilderFor(null)}
        title={`Question bank — ${builderFor?.title ?? ''}`}
        size="lg"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => void randomizeFromBank()} disabled={loading}>Random 5</button>
            <button type="button" className="btn-primary" onClick={() => void saveQuestions()} disabled={loading || !selectedQuestionIds.length}>
              Save {selectedQuestionIds.length} question(s)
            </button>
          </>
        }
      >
        <p className="text-sm text-ink-3 mb-4">Select questions from your bank. Questions are referenced by ID — edits create new versions without breaking this quiz.</p>
        <div className="max-h-80 overflow-y-auto space-y-2">
          {bankQuestions.map((q) => (
            <label key={q.id} className="flex items-start gap-3 rounded-lg border border-stone-200 p-3 cursor-pointer hover:bg-stone-50">
              <input
                type="checkbox"
                checked={selectedQuestionIds.includes(q.id)}
                onChange={(e) => {
                  setSelectedQuestionIds((prev) =>
                    e.target.checked ? [...prev, q.id] : prev.filter((id) => id !== q.id),
                  )
                }}
                className="mt-1"
              />
              <span className="text-sm text-ink">{q.question}</span>
            </label>
          ))}
        </div>
      </Modal>

      <Modal
        open={!!analyticsFor}
        onClose={() => { setAnalyticsFor(null); setAnalytics(null) }}
        title={`Analytics — ${analyticsFor?.title ?? ''}`}
        footer={<button type="button" className="btn-secondary" onClick={() => setAnalyticsFor(null)}>Close</button>}
      >
        {analytics ? (
          <div className="grid gap-4 sm:grid-cols-2 text-sm">
            <div><p className="text-ink-3">Attempts</p><p className="text-xl font-bold text-ink">{analytics.attemptCount}</p></div>
            <div><p className="text-ink-3">Average score</p><p className="text-xl font-bold text-ink">{analytics.averageScore}%</p></div>
            <div><p className="text-ink-3">Highest</p><p className="font-semibold">{analytics.highestScore}%</p></div>
            <div><p className="text-ink-3">Lowest</p><p className="font-semibold">{analytics.lowestScore}%</p></div>
            <div><p className="text-ink-3">Pass rate</p><p className="font-semibold">{analytics.passRate}%</p></div>
          </div>
        ) : (
          <p className="text-sm text-ink-3">No attempt data yet.</p>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => void handleDelete()}
        title="Delete quiz"
        message="Student attempt history will be preserved but the quiz will no longer be available for new attempts."
        confirmLabel="Delete quiz"
        variant="danger"
      />
    </div>
  )
}
