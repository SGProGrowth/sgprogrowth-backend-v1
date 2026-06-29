import { Link, useParams, Navigate } from 'react-router-dom'
import { useInstructorCourse } from '../../../hooks/useInstructorDashboard'
import { PageIntro } from '../../../components/dashboard/PageShell'
import { CoursePreviewHero } from '../../../components/instructor/CourseCard'
import { StatusBadge } from '../../../components/instructor/StatusBadge'
import { Button } from '../../../components/ui/Button'

export function InstructorCoursePreviewPage() {
  const { courseId } = useParams()
  const course = useInstructorCourse(courseId)

  if (!course) return <Navigate to="/instructor/courses" replace />

  return (
    <div className="animate-rise">
      <PageIntro
        eyebrow="Course preview"
        title="Student view preview"
        description="This is how learners will see your course in the catalog and course page."
        action={
          <div className="flex gap-2">
            <Button to={`/instructor/courses/${courseId}/edit`} variant="secondary" size="md">Edit course</Button>
            <Button to={`/courses/${courseId}`} variant="primary" size="md">View public page</Button>
          </div>
        }
      />

      <div className="mb-4 flex gap-2">
        <StatusBadge status={course.status} />
        <span className="text-sm text-ink-3">{course.category} · {course.level}</span>
      </div>

      <CoursePreviewHero course={course} />

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <section className="rounded-xl border border-stone-200 bg-white p-6">
            <h2 className="font-display text-lg font-bold text-ink">About this course</h2>
            <p className="mt-3 text-body-lg">{course.description}</p>
          </section>

          <section className="rounded-xl border border-stone-200 bg-white p-6">
            <h2 className="font-display text-lg font-bold text-ink">What you&apos;ll learn</h2>
            <ul className="mt-4 space-y-2">
              {course.learningOutcomes.map((o) => (
                <li key={o} className="flex gap-2 text-sm text-ink-2">
                  <span className="text-forest-700">✓</span>{o}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-stone-200 bg-white p-6">
            <h2 className="font-display text-lg font-bold text-ink">Curriculum</h2>
            <div className="mt-4 space-y-3">
              {course.modules.length === 0 ? (
                <p className="text-sm text-ink-3">No modules added yet.</p>
              ) : (
                course.modules.map((mod) => (
                  <div key={mod.id} className="rounded-lg border border-stone-100 p-4">
                    <p className="font-semibold text-ink">{mod.title}</p>
                    <p className="text-xs text-ink-3 mt-1">{mod.lessons.length} lessons</p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-stone-200 bg-white p-6 sticky top-24">
            <p className="font-display text-2xl font-bold text-ink">{course.price}</p>
            <p className="text-sm text-ink-3 mt-1">{course.duration} · {course.students} students</p>
            {course.coachingIncluded && (
              <p className="mt-3 rounded-md bg-forest-50 px-3 py-2 text-xs font-semibold text-forest-800">Includes 1:1 coaching sessions</p>
            )}
            <button type="button" className="btn-primary w-full mt-4" disabled>Enroll now (preview)</button>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-6">
            <h3 className="font-semibold text-ink">Requirements</h3>
            <ul className="mt-3 space-y-1">
              {course.requirements.map((r) => (
                <li key={r} className="text-sm text-ink-3">• {r}</li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      <div className="mt-8">
        <Link to={`/instructor/courses/${courseId}/edit`} className="text-sm font-semibold text-forest-800">← Back to editor</Link>
      </div>
    </div>
  )
}
