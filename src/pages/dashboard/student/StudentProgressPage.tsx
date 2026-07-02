import { useCallback, useEffect, useState } from 'react'
import { useStudentDashboard } from '../../../hooks/useStudentDashboard'
import { fetchStudentAnalytics, type StudentAnalytics } from '../../../lib/api/analytics'
import { downloadStudentProgressReport } from '../../../lib/api/reports'
import { fetchCourseProgressDetail, type CourseProgressDetail } from '../../../lib/api/progress'
import { CourseModuleProgress, MilestoneTimeline } from '../../../components/student/MilestoneTimeline'
import { CircularProgress } from '../../../components/student/ProgressBar'
import { PageIntro, Panel, StatTile } from '../../../components/student/Panel'
import { Button } from '../../../components/ui/Button'

export function StudentProgressPage() {
  const { workspace } = useStudentDashboard()
  const { summary, milestones, courses } = workspace

  const [courseDetails, setCourseDetails] = useState<CourseProgressDetail[]>([])
  const [analytics, setAnalytics] = useState<StudentAnalytics | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [studentAnalytics, ...details] = await Promise.all([
        fetchStudentAnalytics(),
        ...courses.filter((c) => c.status === 'active').map((c) => fetchCourseProgressDetail(c.id)),
      ])
      setAnalytics(studentAnalytics)
      setCourseDetails(details)
    } catch {
      setAnalytics(null)
      setCourseDetails([])
    } finally {
      setLoading(false)
    }
  }, [courses])

  useEffect(() => {
    void load()
  }, [load])

  const modulesCompleted = courseDetails.reduce((s, c) => s + c.modules.filter((m) => m.progressPct >= 100).length, 0)
  const totalModules = courseDetails.reduce((s, c) => s + c.modules.length, 0)
  const overallProgress = analytics?.overallProgress ?? summary.overallProgress
  const maxMonthly = Math.max(...(analytics?.monthlyActivityChart.map((m) => m.hours) ?? [1]), 1)

  const courseProgressDetails = courseDetails.map((course) => ({
    courseId: course.courseId,
    title: course.courseTitle,
    progress: course.progressPct,
    modules: course.modules.map((mod, i) => ({
      number: i + 1,
      title: mod.title,
      status:
        mod.progressPct >= 100
          ? ('completed' as const)
          : mod.progressPct > 0
            ? ('current' as const)
            : ('locked' as const),
    })),
  }))

  return (
    <div className="animate-rise">
      <PageIntro
        eyebrow="Your journey"
        title="Learning Progress"
        description="Track module completion, career milestones, and certification readiness across all your programs."
        action={
          <Button variant="secondary" size="sm" onClick={() => downloadStudentProgressReport('csv')}>
            Download report
          </Button>
        }
      />

      <div className="mb-8 stat-grid">
        <StatTile label="Overall progress" value={`${overallProgress}%`} hint="Across all active courses" />
        <StatTile label="Modules completed" value={totalModules ? `${modulesCompleted}/${totalModules}` : '—'} hint="Active programs" />
        <StatTile label="Learning streak" value={analytics?.streak ?? summary.streak} hint="Consecutive days" />
        <StatTile label="Certificates" value={analytics?.certificates.length ?? 0} hint="Earned credentials" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5 mb-8">
        <Panel title="Overall completion" className="lg:col-span-2">
          <div className="flex flex-col items-center py-4">
            <CircularProgress value={overallProgress} size={120} strokeWidth={8} label="Complete" />
            <p className="mt-4 text-center text-sm text-ink-3 max-w-xs">
              Assignment avg: {analytics?.assignmentPerformance.averageScore ?? '—'} · Quiz pass rate: {analytics?.quizPerformance.passRate ?? '—'}%
            </p>
          </div>
        </Panel>

        <Panel title="Career roadmap" className="lg:col-span-3">
          <MilestoneTimeline milestones={milestones} />
        </Panel>
      </div>

      {analytics && (
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          <Panel title="Weekly activity">
            <div className="flex items-end gap-2 h-32">
              {analytics.weeklyActivity.map((d) => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-sm ${d.active ? 'bg-forest-600' : 'bg-stone-200'}`}
                    style={{ height: `${Math.max(8, (d.hours / Math.max(...analytics.weeklyActivity.map((x) => x.hours), 1)) * 100)}%` }}
                  />
                  <span className="text-[10px] text-ink-4">{d.day.slice(0, 3)}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Monthly activity">
            <div className="flex items-end gap-2 h-32">
              {analytics.monthlyActivityChart.map((m) => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-sm bg-gold-500" style={{ height: `${(m.hours / maxMonthly) * 100}%`, minHeight: 8 }} />
                  <span className="text-[10px] text-ink-4">{m.month}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      <div>
        <h2 className="mb-4 font-display text-lg font-bold text-ink">Course progress</h2>
        {loading && !courseProgressDetails.length ? (
          <p className="text-sm text-ink-3 py-8 text-center">Loading progress…</p>
        ) : courseProgressDetails.length === 0 ? (
          <p className="text-sm text-ink-3">Enroll in a course to track detailed progress.</p>
        ) : (
          <div className="space-y-6">
            {courseProgressDetails.map((course) => (
              <CourseModuleProgress key={course.courseId} title={course.title} progress={course.progress} modules={course.modules} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
