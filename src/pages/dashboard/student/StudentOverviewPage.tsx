import { Link } from 'react-router-dom'
import { useStudentDashboard } from '../../../contexts/DashboardWorkspaceContext'
import { getGreeting } from '../../../lib/greeting'
import { ContinueLearningCard, EnrolledCourseCard } from '../../../components/student/CourseCards'
import {
  LearningSummaryStrip,
  StreakWidget,
  UpcomingActivitiesList,
  WeeklyActivityChart,
} from '../../../components/student/OverviewWidgets'
import { Panel, EmptyState } from '../../../components/student/Panel'
import { Button } from '../../../components/ui/Button'

export function StudentOverviewPage() {
  const { user, workspace } = useStudentDashboard()
  const firstName = user?.name.split(' ')[0] ?? 'there'
  const { summary } = workspace
  const activeCourses = workspace.courses.filter((c) => c.status === 'active').slice(0, 2)
  const hasCourses = workspace.courses.length > 0

  return (
    <div className="animate-rise space-y-8">
      <header className="rounded-2xl border border-stone-200 bg-white px-6 py-8 md:px-8 shadow-[0_1px_2px_rgba(10,10,10,0.04)]">
        <p className="text-label mb-2">Welcome back</p>
        <h1 className="text-display-lg text-ink">
          {getGreeting()}, {firstName}
        </h1>
        <p className="mt-3 max-w-2xl text-body-lg">
          {hasCourses
            ? `You're ${summary.overallProgress}% through your learning path. Continue your top program and complete pending assignments before your next coaching session.`
            : 'Your dashboard is ready. Browse courses to enroll and start your coaching-led learning journey.'}
        </p>
        {!hasCourses && (
          <div className="mt-6">
            <Button to="/courses" variant="primary">
              Browse courses
            </Button>
          </div>
        )}
      </header>

      <LearningSummaryStrip summary={summary} />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">
          {workspace.continueLearning && <ContinueLearningCard course={workspace.continueLearning} />}

          <Panel
            title="Active courses"
            action={
              <Link to="/dashboard/courses" className="text-sm font-semibold text-forest-800 hover:text-forest-900">
                View all courses
              </Link>
            }
          >
            {activeCourses.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {activeCourses.map((course) => (
                  <EnrolledCourseCard key={course.id} course={course} variant="compact" />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No active courses"
                description="Browse the catalog to enroll in your next coaching-led program."
                action={<Button to="/courses" variant="primary" size="sm">Browse courses</Button>}
              />
            )}
          </Panel>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <StreakWidget
            streak={summary.streak}
            longestStreak={summary.longestStreak}
            weeklyHours={summary.weeklyHours}
            weeklyGoal={summary.weeklyGoal}
          />
          <WeeklyActivityChart data={workspace.weeklyLearning} weeklyHours={summary.weeklyHours} weeklyGoal={summary.weeklyGoal} />
        </div>
      </div>

      <UpcomingActivitiesList activities={workspace.upcomingActivities} />
    </div>
  )
}
