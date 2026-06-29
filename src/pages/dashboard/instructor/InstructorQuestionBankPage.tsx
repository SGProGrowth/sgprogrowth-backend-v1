import { useEffect, useMemo, useState } from 'react'
import { type QuestionDifficulty, type QuestionType } from '../../../data/instructorData'
import { useInstructorDashboard } from '../../../hooks/useInstructorDashboard'
import { PageIntro, TabBar, StatTile, EmptyState } from '../../../components/dashboard/PageShell'
import { Modal, ConfirmDialog, SuccessBanner } from '../../../components/instructor/Modal'
import { FormField, SelectField, TextAreaField } from '../../../components/instructor/FormField'
import { Button } from '../../../components/ui/Button'
import { ResponsiveTable, MobileDataCard } from '../../../components/ui/ResponsiveTable'

const typeLabels: Record<QuestionType, string> = {
  'multiple-choice': 'Multiple choice',
  'true-false': 'True / False',
  'short-answer': 'Short answer',
  essay: 'Essay',
}

const difficultyColors: Record<QuestionDifficulty, string> = {
  easy: 'bg-green-50 text-green-800',
  medium: 'bg-gold-100 text-gold-900',
  hard: 'bg-red-50 text-red-800',
}

export function InstructorQuestionBankPage() {
  const { workspace } = useInstructorDashboard()
  const [tab, setTab] = useState('active')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [difficultyFilter, setDifficultyFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState(workspace?.questionBank ?? [])

  useEffect(() => {
    setItems(workspace?.questionBank ?? [])
  }, [workspace])

  const active = items.filter((q) => q.status === 'active')
  const archived = items.filter((q) => q.status === 'archived')
  const categories = [...new Set(items.map((q) => q.category))]

  const tabs = [
    { id: 'active', label: 'Active', count: active.length },
    { id: 'archived', label: 'Archived', count: archived.length },
  ]

  const displayed = useMemo(() => {
    let list = tab === 'active' ? active : archived
    if (categoryFilter !== 'all') list = list.filter((q) => q.category === categoryFilter)
    if (difficultyFilter !== 'all') list = list.filter((q) => q.difficulty === difficultyFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((item) =>
        item.question.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q),
      )
    }
    return list
  }, [tab, active, archived, categoryFilter, difficultyFilter, search])

  const saveQuestion = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setShowCreate(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }, 1000)
  }

  return (
    <div className="animate-rise">
      <PageIntro
        eyebrow="Assessment library"
        title="Question Bank"
        description="Build a reusable library of questions for quizzes, exams, and course assessments."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" size="md">Import questions</Button>
            <Button variant="primary" size="md" onClick={() => setShowCreate(true)}>+ Add question</Button>
          </div>
        }
      />

      {saved && <SuccessBanner message="Question saved to bank." onDismiss={() => setSaved(false)} />}

      <div className="stat-grid mb-6 sm:mb-8">
        <StatTile label="Total questions" value={items.length} />
        <StatTile label="Categories" value={categories.length} />
        <StatTile label="Used in quizzes" value={items.reduce((s, q) => s + q.usedIn, 0)} hint="Total references" />
        <StatTile label="Archived" value={archived.length} />
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

      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {displayed.length === 0 ? (
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
                  { label: 'Type', value: typeLabels[q.type] },
                  { label: 'Category', value: q.category },
                  { label: 'Points', value: q.points },
                  { label: 'Used in', value: `${q.usedIn} quiz${q.usedIn !== 1 ? 'zes' : ''}` },
                ]}
                actions={
                  <>
                    <button type="button" className="min-h-11 text-sm font-semibold text-forest-800">Edit</button>
                    <button type="button" className="min-h-11 text-sm font-semibold text-red-600" onClick={() => setDeleteId(q.id)}>Archive</button>
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
                    <td className="px-5 py-4 text-ink-2 whitespace-nowrap">{typeLabels[q.type]}</td>
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
                        <button type="button" className="text-sm font-semibold text-forest-800">Edit</button>
                        <button type="button" className="text-sm font-semibold text-red-600" onClick={() => setDeleteId(q.id)}>Archive</button>
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
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Add question"
        size="lg"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)} disabled={loading}>Cancel</button>
            <button type="button" className="btn-primary" onClick={saveQuestion} disabled={loading}>
              {loading ? 'Saving…' : 'Save question'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <TextAreaField label="Question text" placeholder="Enter the question…" rows={3} required />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label="Question type" options={[
              { value: 'multiple-choice', label: 'Multiple choice' },
              { value: 'true-false', label: 'True / False' },
              { value: 'short-answer', label: 'Short answer' },
              { value: 'essay', label: 'Essay' },
            ]} />
            <SelectField label="Difficulty" options={[
              { value: 'easy', label: 'Easy' },
              { value: 'medium', label: 'Medium' },
              { value: 'hard', label: 'Hard' },
            ]} />
            <FormField label="Category" placeholder="e.g. Cloud Storage" required />
            <FormField label="Points" type="number" defaultValue="2" required />
            <FormField label="Tags" placeholder="S3, Storage (comma-separated)" className="sm:col-span-2" />
          </div>
          <TextAreaField label="Answer options / correct answer" placeholder="For MCQ: list options. For T/F: specify correct answer. For essay: provide grading rubric…" rows={4} />
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          setItems((p) => p.map((q) => (q.id === deleteId ? { ...q, status: 'archived' as const } : q)))
          setDeleteId(null)
        }}
        title="Archive question"
        message="This question will be moved to the archive. Existing quizzes using it will not be affected."
        confirmLabel="Archive"
      />
    </div>
  )
}
