import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { startQuizAttempt } from '../../../lib/api/quizzes'
import { Button } from '../../../components/ui/Button'
import { PageIntro } from '../../../components/student/Panel'
import { AlertBanner } from '../../../components/ui/AlertBanner'
import { LoadingState } from '../../../components/ui/LoadingState'
import { getFriendlyErrorMessage } from '../../../lib/api/errors'

export function StudentQuizStartPage() {
  const { quizId } = useParams<{ quizId: string }>()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const begin = async () => {
    if (!quizId) return
    setError('')
    setLoading(true)
    try {
      const player = await startQuizAttempt(quizId)
      navigate(`/dashboard/quizzes/${quizId}/attempt/${player.attemptId}`, { replace: true })
    } catch (e) {
      setError(getFriendlyErrorMessage(e, 'Could not start the quiz. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-rise max-w-lg mx-auto text-center py-12">
      <PageIntro eyebrow="Quiz" title="Ready to begin?" description="Your progress will be saved automatically. The timer starts when you begin." />
      {error && (
        <AlertBanner variant="error" className="mb-4 text-left">
          {error}
        </AlertBanner>
      )}
      {loading ? (
        <LoadingState label="Starting quiz…" />
      ) : (
        <Button variant="primary" size="lg" onClick={() => void begin()}>Start quiz</Button>
      )}
      <p className="mt-4"><Link to="/dashboard/quizzes" className="action-link inline-flex">Back to quizzes</Link></p>
    </div>
  )
}
