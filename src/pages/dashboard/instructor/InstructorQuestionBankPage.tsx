import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { type QuestionDifficulty, type QuestionType } from '../../../data/instructorData'
import {
  archiveQuestion,
  createQuestion,
  duplicateQuestion,
  exportQuestionsCsv,
  exportQuestionsExcel,
  fetchQuestions,
  importQuestionsFile,
  mapApiQuestion,
  previewQuestion,
  restoreQuestion,
  updateQuestion,
} from '../../../lib/api/questions'
import { PageIntro, TabBar, StatTile, EmptyState } from '../../../components/dashboard/PageShell'
import { Modal, ConfirmDialog, SuccessBanner } from '../../../components/instructor/Modal'
import { FormField, SelectField, TextAreaField } from '../../../components/instructor/FormField'
import { Button } from '../../../components/ui/Button'
import { ResponsiveTable, MobileDataCard } from '../../../components/ui/ResponsiveTable'
import type { QuestionBankItem } from '../../../data/instructorData'
import type { QuestionDetail } from '../../../lib/api/questions'

const typeLabels: Record<string, string> = {
  'multiple-choice': 'Multiple choice',
  'multiple-choice-multi': 'Multiple choice (multi)',
  'true-false': 'True / False',
  'short-answer': 'Short answer',
  essay: 'Long answer',
  'long-answer': 'Long answer',
  'fill-blank': 'Fill in the blank',
  matching: 'Matching',
  ordering: 'Ordering',
}

const difficultyColors: Record<QuestionDifficulty, string> = {
  easy: 'bg-green-50 text-green-800',
  medium: 'bg-gold-100 text-gold-900',
  hard: 'bg-red-50 text-red-800',
}

const typeOptions = [
  { value: 'multiple-choice', label: 'Multiple choice (single)' },
  { value: 'multiple-choice-multi', label: 'Multiple choice (multi)' },
  { value: 'true-false', label: 'True / False' },
  { value: 'short-answer', label: 'Short answer' },
  { value: 'essay', label: 'Long answer' },
  { value: 'fill-blank', label: 'Fill in the blank' },
  { value: 'matching', label: 'Matching' },
  { value: 'ordering', label: 'Ordering' },
]

export function InstructorQuestionBankPage() {
  const [tab, setTab] = useState('active')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [difficultyFilter, setDifficultyFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [editTarget, setEditTarget] = useState<QuestionBankItem | null>(null)
  const [previewTarget, setPreviewTarget] = useState<QuestionDetail | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [items, setItems] = useState<QuestionBankItem[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    questionText: '',
    type: 'multiple-choice' as QuestionType,
    difficulty: 'medium' as QuestionDifficulty,
    category: '',
    marks: '2',
    tags: '',
    options: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetchQuestions({
        pageSize: 100,
        q: search.trim() || undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        difficulty: difficultyFilter !== 'all' ? (difficultyFilter as QuestionDifficulty) : undefined,
        status: tab === 'active' ? 'active' : 'archived',
      })
      setItems(res.data.map(mapApiQuestion))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load questions')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [search, categoryFilter, difficultyFilter, tab])

  useEffect(() => {
    void load()
  }, [load])

  const categories = [...new Set(items.map((q) => q.category))]

  const tabs = [
    { id: 'active', label: 'Active', count: tab === 'active' ? items.length : undefined },
    { id: 'archived', label: 'Archived', count: tab === 'archived' ? items.length : undefined },
  ]

  const displayed = useMemo(() => items, [items])

  const saveQuestion = async () => {
    setLoading(true)
    setError('')
    try {
      const optionLines = form.options.split('\n').map((l) => l.trim()).filter(Boolean)
      const options = optionLines.map((text, i) => ({
        label: String.fromCharCode(65 + i),
        text,
        isCorrect: i === 0,
      }))
      const payload = {
        questionText: form.questionText,
        type: form.type,
        difficulty: form.difficulty,
        category: form.category || 'General',
        marks: Number(form.marks) || 1,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        options: options.length ? options : undefined,
      }
      if (editTarget) {
        await updateQuestion(editTarget.id, payload)
        setEditTarget(null)
      } else {
        await createQuestion(payload)
        setShowCreate(false)
      }
      setForm({ questionText: '', type: 'multiple-choice', difficulty: 'medium', category: '', marks: '2', tags: '', options: '' })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save question')
    } finally {
      setLoading(false)
    }
  }

  const openEdit = (q: QuestionBankItem) => {
    setForm({
      questionText: q.question,
      type: q.type,
      difficulty: q.difficulty,
      category: q.category,
      marks: String(q.points),
      tags: q.tags.join(', '),
      options: '',
    })
    setEditTarget(q)
  }

  const openPreview = async (id: string) => {
    setLoading(true)
    try {
      const detail = await previewQuestion(id)
      setPreviewTarget(detail)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Preview failed')
    } finally {
      setLoading(false)
    }
  }

  const handleArchive = async () => {
    if (!archiveTarget) return
    try {
      if (tab === 'archived') await restoreQuestion(archiveTarget)
      else await archiveQuestion(archiveTarget)
      setArchiveTarget(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed')
    }
  }

  const handleImport = async (file: File) => {
    setLoading(true)
    try {
      const report = await importQuestionsFile(file)
      setSaved(true)
      setError(report.failed ? `${report.imported} imported, ${report.failed} failed` : '')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-rise">
      <PageIntro
        eyebrow="Assessment library"
        title="Question Bank"
        description="Build a reusable library of questions for quizzes, exams, and course assessments."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" size="md" onClick={() => void exportQuestionsCsv({ status: tab === 'active' ? 'active' : 'archived' })}>Export CSV</Button>
            <Button variant="secondary" size="md" onClick={() => void exportQuestionsExcel({ status: tab === 'active' ? 'active' : 'archived' })}>Export Excel</Button>
            <Button variant="secondary" size="md" onClick={() => fileInputRef.current?.click()}>Import questions</Button>
            <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleImport(f) }} />
            <Button variant="primary" size="md" onClick={() => setShowCreate(true)}>+ Add question</Button>
          </div>
        }
      />

      {saved && <SuccessBanner message="Question bank updated." onDismiss={() => setSaved(false)} />}
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="stat-grid mb-6 sm:mb-8">
        <StatTile label="Total questions" value={items.length} />
        <StatTile label="Categories" value={categories.length} />
        <StatTile label="Used in quizzes" value={items.reduce((s, q) => s + q.usedIn, 0)} hint="Total references" />
        <StatTile label="Archived" value={tab === 'archived' ? items.length : '—'} />
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center flex-wrap">
        <input
          type="search"
          placeholder="Search questions, tags, categories…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field h-10 flex-1 min-w-[200px] max-w-md"
        />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="input-field h-10 w-full sm:w-auto">
          <option value="all">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)} className="input-field h-10 w-full sm:w-auto">
          <option value="all">All difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      <TabBar tabs={tabs.map((t) => ({ ...t, count: t.count ?? 0 }))} active={tab} onChange={setTab} />

      {loading && !displayed.length ? (
        <p className="text-sm text-ink-3 py-8 text-center">Loading questions…</p>
      ) : displayed.length === 0 ? (
        <EmptyState title="No questions found" description="Add questions to your bank or adjust filters." />
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {displayed.map((q) => (
              <MobileDataCard
                key={q.id}
                title={q.question}
                badge={
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${difficultyColors[q.difficulty]}`}>
                    {q.difficulty}
                  </span>
                }
                fields={[
                  { label: 'Type', value: typeLabels[q.type] ?? q.type },
                  { label: 'Category', value: q.category },
                  { label: 'Points', value: q.points },
                  { label: 'Used in', value: `${q.usedIn} quiz${q.usedIn !== 1 ? 'zes' : ''}` },
                ]}
                actions={
                  <>
                    <button type="button" className="min-h-11 text-sm font-semibold text-forest-800" onClick={() => void openPreview(q.id)}>Preview</button>
                    <button type="button" className="min-h-11 text-sm font-semibold text-forest-800" onClick={() => openEdit(q)}>Edit</button>
                    <button type="button" className="min-h-11 text-sm font-semibold text-forest-800" onClick={() => void duplicateQuestion(q.id).then(load)}>Duplicate</button>
                    <button type="button" className="min-h-11 text-sm font-semibold text-red-600" onClick={() => setArchiveTarget(q.id)}>
                      {tab === 'archived' ? 'Restore' : 'Archive'}
                    </button>
                  </>
                }
              />
            ))}
          </div>

          <ResponsiveTable className="hidden md:block rounded-xl border border-stone-200 bg-white">
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50 text-left">
                  <th className="px-5 py-3 font-semibold text-ink-2">Question</th>
                  <th className="px-5 py-3 font-semibold text-ink-2">Type</th>
                  <th className="px-5 py-3 font-semibold text-ink-2">Category</th>
                  <th className="px-5 py-3 font-semibold text-ink-2">Difficulty</th>
                  <th className="px-5 py-3 font-semibold text-ink-2">Points</th>
                  <th className="px-5 py-3 font-semibold text-ink-2">Used in</th>
                  <th className="px-5 py-3 font-semibold text-ink-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {displayed.map((q) => (
                  <tr key={q.id} className="hover:bg-stone-50/50">
                    <td className="px-5 py-4 max-w-xs">
                      <p className="font-medium text-ink line-clamp-2">{q.question}</p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {q.tags.map((t) => (
                          <span key={t} className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] text-ink-3">{t}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-ink-2 whitespace-nowrap">{typeLabels[q.type] ?? q.type}</td>
                    <td className="px-5 py-4 text-ink-2 whitespace-nowrap">{q.category}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${difficultyColors[q.difficulty]}`}>
                        {q.difficulty}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-ink">{q.points}</td>
                    <td className="px-5 py-4 text-ink-3">{q.usedIn} quiz{q.usedIn !== 1 ? 'zes' : ''}</td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button type="button" className="text-sm font-semibold text-forest-800" onClick={() => void openPreview(q.id)}>Preview</button>
                        <button type="button" className="text-sm font-semibold text-forest-800" onClick={() => openEdit(q)}>Edit</button>
                        <button type="button" className="text-sm font-semibold text-forest-800" onClick={() => void duplicateQuestion(q.id).then(load)}>Duplicate</button>
                        <button type="button" className="text-sm font-semibold text-red-600" onClick={() => setArchiveTarget(q.id)}>
                          {tab === 'archived' ? 'Restore' : 'Archive'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ResponsiveTable>
        </>
      )}

      <Modal
        open={showCreate || !!editTarget}
        onClose={() => { setShowCreate(false); setEditTarget(null) }}
        title={editTarget ? 'Edit question' : 'Add question'}
        size="lg"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => { setShowCreate(false); setEditTarget(null) }} disabled={loading}>Cancel</button>
            <button type="button" className="btn-primary" onClick={() => void saveQuestion()} disabled={loading}>
              {loading ? 'Saving…' : editTarget ? 'Update question' : 'Save question'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <TextAreaField label="Question text" placeholder="Enter the question…" rows={3} required value={form.questionText} onChange={(e) => setForm((f) => ({ ...f, questionText: e.target.value }))} />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label="Question type" options={typeOptions} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as QuestionType }))} />
            <SelectField label="Difficulty" options={[{ value: 'easy', label: 'Easy' }, { value: 'medium', label: 'Medium' }, { value: 'hard', label: 'Hard' }]} value={form.difficulty} onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value as QuestionDifficulty }))} />
            <FormField label="Category" placeholder="e.g. Cloud Storage" required value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
            <FormField label="Points" type="number" required value={form.marks} onChange={(e) => setForm((f) => ({ ...f, marks: e.target.value }))} />
            <FormField label="Tags" placeholder="S3, Storage (comma-separated)" className="sm:col-span-2" value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} />
          </div>
          <TextAreaField label="Answer options (one per line, first is correct for MCQ)" placeholder="Option A&#10;Option B&#10;Option C" rows={4} value={form.options} onChange={(e) => setForm((f) => ({ ...f, options: e.target.value }))} />
        </div>
      </Modal>

      <Modal
        open={!!previewTarget}
        onClose={() => setPreviewTarget(null)}
        title="Question preview"
        size="lg"
        footer={<button type="button" className="btn-secondary" onClick={() => setPreviewTarget(null)}>Close</button>}
      >
        {previewTarget && (
          <div className="space-y-4 text-sm">
            <p className="font-medium text-ink">{previewTarget.question}</p>
            <div className="grid gap-2 sm:grid-cols-2 text-ink-2">
              <p><span className="font-semibold text-ink">Type:</span> {typeLabels[mapApiQuestion(previewTarget).type] ?? previewTarget.type}</p>
              <p><span className="font-semibold text-ink">Difficulty:</span> {previewTarget.difficulty}</p>
              <p><span className="font-semibold text-ink">Points:</span> {previewTarget.marks ?? previewTarget.points}</p>
              <p><span className="font-semibold text-ink">Category:</span> {previewTarget.category}</p>
            </div>
            {previewTarget.explanation && (
              <div className="rounded-lg bg-stone-50 p-3">
                <p className="text-xs font-semibold uppercase text-ink-3 mb-1">Explanation</p>
                <p className="text-ink-2">{previewTarget.explanation}</p>
              </div>
            )}
            {previewTarget.options?.length ? (
              <ul className="list-disc pl-5 space-y-1 text-ink-2">
                {previewTarget.options.map((o) => (
                  <li key={o.id ?? o.text} className={o.isCorrect ? 'font-semibold text-forest-800' : undefined}>{o.text}</li>
                ))}
              </ul>
            ) : null}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        onConfirm={() => void handleArchive()}
        title={tab === 'archived' ? 'Restore question' : 'Archive question'}
        message={tab === 'archived' ? 'Restore this question to the active bank?' : 'This question will be moved to the archive. Existing quizzes using it will not be affected.'}
        confirmLabel={tab === 'archived' ? 'Restore' : 'Archive'}
      />
    </div>
  )
}
