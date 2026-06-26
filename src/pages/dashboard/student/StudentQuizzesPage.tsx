import { useState } from 'react'
import {
  getCompletedQuizzes,
  getUpcomingQuizzes,
  quizAnalytics,
  quizzes,
} from '../../../data/studentData'
import { QuizAnalyticsPanel, QuizCard } from '../../../components/student/QuizCard'
import { PageIntro, TabBar } from '../../../components/student/Panel'

export function StudentQuizzesPage() {
  const [tab, setTab] = useState('upcoming')
  const upcoming = getUpcomingQuizzes()
  const completed = getCompletedQuizzes()

  const tabs = [
    { id: 'upcoming', label: 'Upcoming', count: upcoming.length },
    { id: 'completed', label: 'Previous results', count: completed.length },
    { id: 'all', label: 'All quizzes', count: quizzes.length },
  ]

  const displayed =
    tab === 'upcoming' ? upcoming
    : tab === 'completed' ? completed
    : quizzes

  return (
    <div className="animate-rise">
      <PageIntro
        eyebrow="Assessments"
        title="Quizzes & Assessments"
        description="Practice exams, knowledge checks, and module assessments — with coaching-led review sessions for certification prep."
      />

      <div className="mb-8">
        <QuizAnalyticsPanel {...quizAnalytics} />
      </div>

      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      <div className="grid gap-4 sm:grid-cols-2">
        {displayed.map((quiz) => (
          <QuizCard
            key={quiz.id}
            quiz={quiz}
            variant={quiz.status === 'upcoming' ? 'upcoming' : 'completed'}
          />
        ))}
      </div>
    </div>
  )
}
