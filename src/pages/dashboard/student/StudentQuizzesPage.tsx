import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Quiz } from '../../../data/studentData'
import { fetchStudentQuizAnalytics, fetchStudentQuizzes } from '../../../lib/api/quizzes'
import { QuizAnalyticsPanel, QuizCard } from '../../../components/student/QuizCard'
import { PageIntro, TabBar } from '../../../components/student/Panel'

type StudentQuizRow = Quiz & { inProgressAttemptId?: string; latestAttemptId?: string; rawStatus?: string }

export function StudentQuizzesPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('upcoming')
  const [quizzes, setQuizzes] = useState<StudentQuizRow[]>([])
  const [analytics, setAnalytics] = useState({
    averageScore: 0,
    quizzesTaken: 0,
    passRate: 0,
    strongestArea: '—',
    needsImprovement: '—',
    trend: '—',
  })
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [list, stats] = await Promise.all([fetchStudentQuizzes(), fetchStudentQuizAnalytics()])
      setQuizzes(
        list.map((q) => ({
          ...q,
          rawStatus: (q as StudentQuizRow & { status: string }).status,
          inProgressAttemptId: (q as StudentQuizRow).inProgressAttemptId,
        })),
      )
      setAnalytics(stats)
    } catch {
      setQuizzes([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const upcoming = quizzes.filter((q) => q.rawStatus === 'upcoming' || q.rawStatus === 'in_progress')
  const completed = quizzes.filter((q) => q.rawStatus === 'completed')

  const tabs = [
    { id: 'upcoming', label: 'Upcoming', count: upcoming.length },
    { id: 'completed', label: 'Previous results', count: completed.length },
    { id: 'all', label: 'All quizzes', count: quizzes.length },
  ]

  const displayed =
    tab === 'upcoming' ? upcoming
    : tab === 'completed' ? completed
    : quizzes

  const handleStart = (quiz: StudentQuizRow) => {
    if (quiz.inProgressAttemptId) {
      navigate(`/dashboard/quizzes/${quiz.id}/attempt/${quiz.inProgressAttemptId}`)
    } else {
      navigate(`/dashboard/quizzes/${quiz.id}/start`)
    }
  }

  const handleResults = (quiz: StudentQuizRow) => {
    if (quiz.latestAttemptId) {
      navigate(`/dashboard/quizzes/${quiz.id}/results/${quiz.latestAttemptId}`)
    }
  }

  return (
    <div className="animate-rise">
      <PageIntro
        eyebrow="Assessments"
        title="Quizzes & Assessments"
        description="Practice exams, knowledge checks, and module assessments — with coaching-led review sessions for certification prep."
      />

      <div className="mb-8">
        <QuizAnalyticsPanel {...analytics} />
      </div>

      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {loading && !displayed.length ? (
        <p className="text-sm text-ink-3 py-8 text-center">Loading quizzes…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {displayed.map((quiz) => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              variant={quiz.rawStatus === 'completed' ? 'completed' : 'upcoming'}
              onStart={() => handleStart(quiz)}
              onResults={() => handleResults(quiz)}
              onRetake={() => handleStart(quiz)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
