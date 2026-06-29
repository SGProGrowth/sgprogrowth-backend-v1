import { useStudentDashboard } from '../../../hooks/useStudentDashboard'
import { CourseModuleProgress, MilestoneTimeline } from '../../../components/student/MilestoneTimeline'
import { CircularProgress } from '../../../components/student/ProgressBar'
import { PageIntro, Panel, StatTile } from '../../../components/student/Panel'

export function StudentProgressPage() {
  const { workspace } = useStudentDashboard()

  const { summary, milestones, courses } = workspace
  const modulesCompleted = courses.reduce((s, c) => s + c.modulesCompleted, 0)
  const totalModules = courses.reduce((s, c) => s + c.totalModules, 0)
  const courseProgressDetails = courses
    .filter((c) => c.status === 'active')
    .map((c) => ({
      courseId: c.id,
      title: c.title,
      progress: c.progress,
      modules: Array.from({ length: c.totalModules }, (_, i) => ({
        number: i + 1,
        title: i < c.modulesCompleted ? `Module ${i + 1}` : i === c.modulesCompleted ? c.nextLesson : `Module ${i + 1}`,
        status: i < c.modulesCompleted ? ('completed' as const) : i === c.modulesCompleted ? ('current' as const) : ('locked' as const),
      })),
    }))

  return (
    <div className="animate-rise">
      <PageIntro
        eyebrow="Your journey"
        title="Learning Progress"
        description="Track module completion, career milestones, and certification readiness across all your programs."
      />

      <div className="mb-8 stat-grid">
        <StatTile label="Overall progress" value={`${summary.overallProgress}%`} hint="Across all active courses" />
        <StatTile label="Modules completed" value={`${modulesCompleted}/${totalModules}`} hint="Active programs" />
        <StatTile label="Certifications in progress" value={summary.certificationsInProgress} hint="In-progress tracks" />
        <StatTile label="Learning hours" value={`${summary.totalHours}h`} hint={`${summary.weeklyHours}h this week`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5 mb-8">
        <Panel title="Overall completion" className="lg:col-span-2">
          <div className="flex flex-col items-center py-4">
            <CircularProgress value={summary.overallProgress} size={120} strokeWidth={8} label="Complete" />
            <p className="mt-4 text-center text-sm text-ink-3 max-w-xs">
              Stay consistent with your weekly learning goal and coaching sessions to maintain momentum.
            </p>
          </div>
        </Panel>

        <Panel title="Career roadmap" className="lg:col-span-3">
          <MilestoneTimeline milestones={milestones} />
        </Panel>
      </div>

      <div>
        <h2 className="mb-4 font-display text-lg font-bold text-ink">Course progress</h2>
        <div className="space-y-6">
          {courseProgressDetails.map((course) => (
            <CourseModuleProgress key={course.courseId} title={course.title} progress={course.progress} modules={course.modules} />
          ))}
        </div>
      </div>
    </div>
  )
}
