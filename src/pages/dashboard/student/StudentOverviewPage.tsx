import { useAuth } from '../../../contexts/AuthContext'
import {
  continueLearning,
  getGreeting,
  learningSummary,
  upcomingActivities,
} from '../../../data/studentData'
import { ContinueLearningCard } from '../../../components/student/CourseCards'
import {
  LearningSummaryStrip,
  StreakWidget,
  UpcomingActivitiesList,
  WeeklyActivityChart,
} from '../../../components/student/OverviewWidgets'
import { EnrolledCourseCard } from '../../../components/student/CourseCards'
import { getActiveCourses } from '../../../data/studentData'
import { Panel } from '../../../components/student/Panel'
import { Link } from 'react-router-dom'

export function StudentOverviewPage() {
  const { user } = useAuth()
  const firstName = user?.name.split(' ')[0] ?? 'there'
  const activeCourses = getActiveCourses().slice(0, 2)

  return (
    <div className="animate-rise space-y-8">
      {/* Welcome */}
      <header className="rounded-2xl border border-stone-200 bg-white px-6 py-8 md:px-8 shadow-[0_1px_2px_rgba(10,10,10,0.04)]">
        <p className="text-label mb-2">Welcome back</p>
        <h1 className="text-display-lg text-ink">
          {getGreeting()}, {firstName}
        </h1>
        <p className="mt-3 max-w-2xl text-body-lg">
          You&apos;re {learningSummary.overallProgress}% through your learning path. Continue AWS prep and complete
          today&apos;s assignment before your coaching session tomorrow.
        </p>
      </header>

      <LearningSummaryStrip />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">
          {continueLearning && <ContinueLearningCard course={continueLearning} />}

          <Panel
            title="Active courses"
            action={
              <Link to="/dashboard/courses" className="text-sm font-semibold text-forest-800 hover:text-forest-900">
                View all courses
              </Link>
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {activeCourses.map((course) => (
                <EnrolledCourseCard key={course.id} course={course} variant="compact" />
              ))}
            </div>
          </Panel>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <StreakWidget />
          <WeeklyActivityChart />
        </div>
      </div>

      <UpcomingActivitiesList activities={upcomingActivities} />
    </div>
  )
}
