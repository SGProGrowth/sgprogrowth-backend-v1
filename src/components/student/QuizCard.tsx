import type { Quiz } from '../../data/studentData'
import { Button } from '../ui/Button'
import { CircularProgress } from './ProgressBar'

interface QuizCardProps {
  quiz: Quiz
  variant?: 'upcoming' | 'completed'
  onStart?: () => void
  onResults?: () => void
  onRetake?: () => void
}

export function QuizCard({ quiz, variant, onStart, onResults, onRetake }: QuizCardProps) {
  const isUpcoming = variant === 'upcoming' || quiz.status === 'upcoming'
  const scorePercent = quiz.score !== undefined ? Math.round((quiz.score / quiz.maxScore) * 100) : 0

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 hover:border-stone-300 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-4">{quiz.courseTitle}</p>
          <h3 className="mt-1 font-display text-base font-bold text-ink">{quiz.title}</h3>
          <p className="mt-1 text-sm text-ink-3">{quiz.dateLabel}</p>
        </div>
        {!isUpcoming && quiz.score !== undefined && (
          <CircularProgress value={scorePercent} size={56} strokeWidth={4} />
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-ink-3">
        <span className="rounded-md bg-stone-100 px-2 py-1">{quiz.duration}</span>
        <span className="rounded-md bg-stone-100 px-2 py-1">
          {quiz.attempts}/{quiz.maxAttempts} attempts
        </span>
        <span className="rounded-md bg-stone-100 px-2 py-1">Max: {quiz.maxScore} pts</span>
      </div>

      <div className="mt-4 flex gap-2 border-t border-stone-100 pt-4">
        {isUpcoming ? (
          <>
            <Button variant="primary" size="sm" onClick={onStart}>Start quiz</Button>
            <Button variant="ghost" size="sm">Review materials</Button>
          </>
        ) : (
          <>
            <Button variant="secondary" size="sm" onClick={onResults}>View results</Button>
            {quiz.attempts < quiz.maxAttempts && (
              <Button variant="ghost" size="sm" onClick={onRetake}>Retake</Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

interface QuizAnalyticsPanelProps {
  averageScore: number
  quizzesTaken: number
  passRate: number
  strongestArea: string
  needsImprovement: string
  trend: string
}

export function QuizAnalyticsPanel({
  averageScore,
  quizzesTaken,
  passRate,
  strongestArea,
  needsImprovement,
  trend,
}: QuizAnalyticsPanelProps) {
  return (
    <div className="rounded-xl border border-stone-200 bg-gradient-to-br from-stone-50 to-white p-6">
      <h3 className="font-display text-base font-bold text-ink">Performance summary</h3>
      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <p className="text-xs text-ink-3">Average score</p>
          <p className="font-display text-2xl font-bold text-forest-800">{averageScore}%</p>
          <p className="text-xs text-forest-700 mt-0.5">{trend} vs last month</p>
        </div>
        <div>
          <p className="text-xs text-ink-3">Quizzes taken</p>
          <p className="font-display text-2xl font-bold text-ink">{quizzesTaken}</p>
        </div>
        <div>
          <p className="text-xs text-ink-3">Pass rate</p>
          <p className="font-display text-2xl font-bold text-ink">{passRate}%</p>
        </div>
        <div>
          <p className="text-xs text-ink-3">Strongest area</p>
          <p className="text-sm font-semibold text-ink mt-1">{strongestArea}</p>
        </div>
      </div>
      <p className="mt-4 text-sm text-ink-3">
        Focus area: <span className="font-semibold text-ink-2">{needsImprovement}</span>
      </p>
    </div>
  )
}
