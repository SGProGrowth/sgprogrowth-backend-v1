import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  fetchQuizPlayer,
  fetchQuizResult,
  saveQuizAnswers,
  submitQuizAttempt,
  type QuizPlayerState,
  type QuizResultDetail,
} from '../../../lib/api/quizzes'
import { Button } from '../../../components/ui/Button'
import { LoadingState } from '../../../components/ui/LoadingState'
import { RequestError } from '../../../components/ui/RequestError'
import { getFriendlyErrorMessage } from '../../../lib/api/errors'
import { AlertBanner } from '../../../components/ui/AlertBanner'
import { PageIntro } from '../../../components/student/Panel'

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function StudentQuizPlayerPage() {
  const { quizId, attemptId } = useParams<{ quizId: string; attemptId: string }>()
  const navigate = useNavigate()
  const [player, setPlayer] = useState<QuizPlayerState | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [responses, setResponses] = useState<Record<string, unknown>>({})
  const [flagged, setFlagged] = useState<Set<string>>(new Set())
  const [remaining, setRemaining] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    if (!attemptId) return
    try {
      const data = await fetchQuizPlayer(attemptId)
      setPlayer(data)
      const initial: Record<string, unknown> = {}
      const flags = new Set<string>()
      for (const q of data.questions) {
        if (q.savedResponse != null) initial[q.quizQuestionId] = q.savedResponse
        if (q.flagged) flags.add(q.quizQuestionId)
      }
      setResponses(initial)
      setFlagged(flags)
      if (data.expiresAt) {
        setRemaining(Math.max(0, Math.floor((new Date(data.expiresAt).getTime() - Date.now()) / 1000)))
      }
    } catch (e) {
      setError(getFriendlyErrorMessage(e, 'Failed to load quiz.'))
    }
  }, [attemptId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (remaining == null || remaining <= 0) return
    const t = setInterval(() => {
      setRemaining((r) => {
        if (r == null || r <= 1) {
          void handleSubmit(true)
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining != null])

  const current = player?.questions[currentIndex]

  const persist = useCallback(async () => {
    if (!attemptId || !player) return
    const answers = player.questions.map((q) => ({
      quizQuestionId: q.quizQuestionId,
      response: responses[q.quizQuestionId] ?? {},
      flagged: flagged.has(q.quizQuestionId),
    }))
    await saveQuizAnswers(attemptId, answers)
  }, [attemptId, player, responses, flagged])

  useEffect(() => {
    if (!player) return
    const t = setInterval(() => { void persist() }, 15000)
    return () => clearInterval(t)
  }, [player, persist])

  const setAnswer = (quizQuestionId: string, value: unknown) => {
    setResponses((prev) => ({ ...prev, [quizQuestionId]: value }))
  }

  const toggleFlag = (quizQuestionId: string) => {
    setFlagged((prev) => {
      const next = new Set(prev)
      if (next.has(quizQuestionId)) next.delete(quizQuestionId)
      else next.add(quizQuestionId)
      return next
    })
  }

  const handleSubmit = async (auto = false) => {
    if (!attemptId || !quizId || submitting) return
    setSubmitting(true)
    try {
      await persist()
      const result = await submitQuizAttempt(attemptId)
      navigate(`/dashboard/quizzes/${quizId}/results/${attemptId}`, {
        state: { result, autoSubmitted: auto },
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submit failed')
      setSubmitting(false)
    }
  }

  const renderInput = useMemo(() => {
    if (!current) return null
    const val = responses[current.quizQuestionId]

    if (current.type === 'multiple_choice' || current.type === 'true_false') {
      return (
        <div className="space-y-2 mt-4">
          {current.options.map((o) => (
            <label key={o.id} className="flex items-center gap-3 rounded-lg border border-stone-200 p-3 cursor-pointer hover:bg-stone-50">
              <input
                type="radio"
                name={current.quizQuestionId}
                checked={(val as { value?: string })?.value === o.text}
                onChange={() => setAnswer(current.quizQuestionId, { value: o.text })}
              />
              <span className="text-sm">{o.text}</span>
            </label>
          ))}
        </div>
      )
    }

    if (current.type === 'multiple_choice_multi') {
      const selected = new Set(asArray((val as { values?: string[] })?.values))
      return (
        <div className="space-y-2 mt-4">
          {current.options.map((o) => (
            <label key={o.id} className="flex items-center gap-3 rounded-lg border border-stone-200 p-3 cursor-pointer hover:bg-stone-50">
              <input
                type="checkbox"
                checked={selected.has(o.text)}
                onChange={(e) => {
                  const next = new Set(selected)
                  if (e.target.checked) next.add(o.text)
                  else next.delete(o.text)
                  setAnswer(current.quizQuestionId, { values: [...next] })
                }}
              />
              <span className="text-sm">{o.text}</span>
            </label>
          ))}
        </div>
      )
    }

    if (current.type === 'fill_blank' || current.type === 'short_answer') {
      return (
        <input
          className="input-field mt-4 w-full"
          value={String((val as { value?: string })?.value ?? '')}
          onChange={(e) => setAnswer(current.quizQuestionId, { value: e.target.value })}
          placeholder="Your answer"
        />
      )
    }

    return (
      <textarea
        className="input-field mt-4 w-full min-h-[120px]"
        value={String((val as { value?: string })?.value ?? '')}
        onChange={(e) => setAnswer(current.quizQuestionId, { value: e.target.value })}
        placeholder="Your answer"
      />
    )
  }, [current, responses])

  if (error && !player) {
    return (
      <div className="animate-rise max-w-lg mx-auto py-8">
        <AlertBanner variant="error">{error}</AlertBanner>
        <div className="mt-4">
          <Button to="/dashboard/quizzes" variant="secondary">Back to quizzes</Button>
        </div>
      </div>
    )
  }

  if (!player || !current) {
    return <LoadingState label="Loading quiz…" className="max-w-lg mx-auto" />
  }

  return (
    <div className="animate-rise max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wider text-ink-4">Question {currentIndex + 1} of {player.questions.length}</p>
          <h1 className="font-display text-xl font-bold text-ink">{player.title}</h1>
        </div>
        {remaining != null && (
          <div className="rounded-lg bg-stone-100 px-4 py-2 font-mono text-lg font-bold text-ink">
            {formatTime(remaining)}
          </div>
        )}
      </div>

      {player.instructions && (
        <p className="text-sm text-ink-3 mb-4 rounded-lg bg-stone-50 p-3">{player.instructions}</p>
      )}

      <article className="rounded-xl border border-stone-200 bg-white p-6">
        <div className="flex justify-between gap-2">
          <p className="font-medium text-ink">{current.questionText}</p>
          <span className="text-xs text-ink-4 whitespace-nowrap">{current.points} pt{current.points !== 1 ? 's' : ''}</span>
        </div>
        {renderInput}
        <button
          type="button"
          className={`mt-4 text-sm font-semibold ${flagged.has(current.quizQuestionId) ? 'text-gold-800' : 'text-ink-3'}`}
          onClick={() => toggleFlag(current.quizQuestionId)}
        >
          {flagged.has(current.quizQuestionId) ? 'Flagged for review' : 'Flag question'}
        </button>
      </article>

      <div className="mt-6 flex flex-wrap gap-2">
        {player.questions.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setCurrentIndex(i)}
            className={`h-9 w-9 rounded-lg text-sm font-semibold ${i === currentIndex ? 'bg-forest-800 text-white' : responses[player.questions[i].quizQuestionId] ? 'bg-forest-50 text-forest-800' : 'bg-stone-100 text-ink-3'}`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <div className="mt-8 flex justify-between gap-3">
        <Button variant="secondary" disabled={currentIndex === 0} onClick={() => setCurrentIndex((i) => i - 1)}>Previous</Button>
        {currentIndex < player.questions.length - 1 ? (
          <Button variant="primary" onClick={() => setCurrentIndex((i) => i + 1)}>Next</Button>
        ) : (
          <Button variant="primary" disabled={submitting} onClick={() => void handleSubmit()}>{submitting ? 'Submitting…' : 'Submit quiz'}</Button>
        )}
      </div>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </div>
  )
}

function asArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String)
  return []
}

export function StudentQuizResultPage() {
  const { attemptId } = useParams<{ quizId: string; attemptId?: string }>()
  const location = useLocation()
  const locState = location.state as { result?: QuizResultDetail; autoSubmitted?: boolean } | null
  const [result, setResult] = useState<QuizResultDetail | null>(locState?.result ?? null)
  const [loading, setLoading] = useState(!locState?.result)
  const [error, setError] = useState<string | null>(null)

  const loadResult = () => {
    if (!attemptId) return
    setLoading(true)
    setError(null)
    void fetchQuizResult(attemptId)
      .then(setResult)
      .catch((err) => {
        setResult(null)
        setError(getFriendlyErrorMessage(err, 'Unable to load quiz results.'))
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (result || !attemptId) return
    loadResult()
  }, [attemptId, result])

  if (loading) return <LoadingState label="Loading results…" className="max-w-lg mx-auto" />
  if (error) {
    return (
      <div className="animate-rise max-w-lg mx-auto py-8">
        <RequestError title="Unable to load results" message={error} onRetry={loadResult} />
        <p className="mt-4 text-center"><Link to="/dashboard/quizzes" className="action-link inline-flex">Back to quizzes</Link></p>
      </div>
    )
  }
  if (!result) {
    return (
      <div className="animate-rise max-w-lg mx-auto py-8 text-center">
        <p className="text-ink-3">No results found for this attempt.</p>
        <p className="mt-4"><Link to="/dashboard/quizzes" className="action-link inline-flex">Back to quizzes</Link></p>
      </div>
    )
  }

  return (
    <div className="animate-rise max-w-2xl mx-auto">
      <PageIntro
        eyebrow="Results"
        title={result.passed ? 'Congratulations!' : 'Quiz complete'}
        description={result.showScore ? `Score: ${result.score ?? 0}/${result.maxScore} (${result.percentage ?? 0}%)` : 'Your submission is being reviewed.'}
      />

      {locState?.autoSubmitted && (
        <p className="text-sm text-gold-800 bg-gold-50 rounded-lg p-3 mb-4">Time expired — your quiz was auto-submitted.</p>
      )}

      {result.showScore && (
        <div className="rounded-xl border border-stone-200 bg-white p-6 mb-6 grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-ink-3">Attempt</p><p className="font-bold text-ink">#{result.attemptNumber}</p></div>
          <div><p className="text-ink-3">Status</p><p className="font-bold capitalize">{result.status.replace(/_/g, ' ')}</p></div>
          <div><p className="text-ink-3">Time taken</p><p className="font-bold">{result.timeTakenSeconds ? formatTime(result.timeTakenSeconds) : '—'}</p></div>
          <div><p className="text-ink-3">Result</p><p className={`font-bold ${result.passed ? 'text-forest-800' : 'text-red-700'}`}>{result.passed ? 'Passed' : 'Not passed'}</p></div>
        </div>
      )}

      {result.showCorrectAnswers && result.answers?.length ? (
        <div className="space-y-3">
          <h2 className="font-semibold text-ink">Review</h2>
          {result.answers.map((a) => (
            <div key={a.quizQuestionId} className="rounded-lg border border-stone-200 p-4 text-sm">
              <p className="font-medium text-ink">{a.questionText}</p>
              <p className="mt-2 text-ink-3">Score: {a.score ?? 0}/{a.maxScore}</p>
              {a.isCorrect != null && (
                <p className={a.isCorrect ? 'text-forest-800' : 'text-red-700'}>{a.isCorrect ? 'Correct' : 'Incorrect'}</p>
              )}
              {result.showExplanations && a.explanation && (
                <p className="mt-2 text-ink-3 bg-stone-50 p-2 rounded">{a.explanation}</p>
              )}
            </div>
          ))}
        </div>
      ) : null}

      <p className="mt-8"><Link to="/dashboard/quizzes" className="text-sm font-semibold text-forest-800">Back to quizzes</Link></p>
    </div>
  )
}
