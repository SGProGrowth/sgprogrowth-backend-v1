import { courseProgressDetails, learningMilestones, learningSummary } from '../../../data/studentData'
import { CourseModuleProgress, MilestoneTimeline } from '../../../components/student/MilestoneTimeline'
import { CircularProgress } from '../../../components/student/ProgressBar'
import { PageIntro, Panel, StatTile } from '../../../components/student/Panel'

export function StudentProgressPage() {
  return (
    <div className="animate-rise">
      <PageIntro
        eyebrow="Your journey"
        title="Learning Progress"
        description="Track module completion, career milestones, and certification readiness across all your programs."
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Overall progress" value={`${learningSummary.overallProgress}%`} hint="Across all active courses" />
        <StatTile label="Modules completed" value="12" hint="Of 30 total modules" />
        <StatTile label="Certifications in progress" value={learningSummary.certificationsInProgress} hint="AWS SAA, PMP track" />
        <StatTile label="Learning hours" value={`${learningSummary.totalHours}h`} hint={`${learningSummary.weeklyHours}h this week`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5 mb-8">
        <Panel title="Overall completion" className="lg:col-span-2">
          <div className="flex flex-col items-center py-4">
            <CircularProgress value={learningSummary.overallProgress} size={120} strokeWidth={8} label="Complete" />
            <p className="mt-4 text-center text-sm text-ink-3 max-w-xs">
              You&apos;re ahead of 68% of learners at your stage. Keep momentum through your coaching sessions.
            </p>
          </div>
        </Panel>

        <Panel title="Career roadmap" className="lg:col-span-3">
          <MilestoneTimeline milestones={learningMilestones} />
        </Panel>
      </div>

      <div>
        <h2 className="mb-4 font-display text-lg font-bold text-ink">Course progress</h2>
        <div className="space-y-6">
          {courseProgressDetails.map((course) => (
            <CourseModuleProgress
              key={course.courseId}
              title={course.title}
              progress={course.progress}
              modules={course.modules}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
