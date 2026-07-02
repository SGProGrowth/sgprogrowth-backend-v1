import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { startQuizAttempt } from '../../../lib/api/quizzes'
import { Button } from '../../../components/ui/Button'
import { PageIntro } from '../../../components/student/Panel'

export function StudentQuizStartPage() {
  const { quizId } = useParams<{ quizId: string }>()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  const begin = async () => {
    if (!quizId) return
    setError('')
    try {
      const player = await startQuizAttempt(quizId)
      navigate(`/dashboard/quizzes/${quizId}/attempt/${player.attemptId}`, { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start quiz')
    }
  }

  return (
    <div className="animate-rise max-w-lg mx-auto text-center py-12">
      <PageIntro eyebrow="Quiz" title="Ready to begin?" description="Your progress will be saved automatically. The timer starts when you begin." />
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
      <Button variant="primary" size="lg" onClick={() => void begin()}>Start quiz</Button>
      <p className="mt-4"><Link to="/dashboard/quizzes" className="text-sm text-forest-800 font-semibold">Back to quizzes</Link></p>
    </div>
  )
}
