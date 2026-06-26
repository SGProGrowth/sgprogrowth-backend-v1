import { Link } from 'react-router-dom'
import type { InstructorCourse } from '../../data/instructorData'
import { StatusBadge } from './StatusBadge'
import { ProgressBar } from '../student/ProgressBar'

const thumbGradients: Record<string, string> = {
  cloud: 'from-sky-600 to-blue-900',
  project: 'from-violet-600 to-purple-900',
  coaching: 'from-amber-500 to-orange-800',
}

interface InstructorCourseRowProps {
  course: InstructorCourse
  onDelete?: (id: string) => void
}

export function InstructorCourseRow({ course }: InstructorCourseRowProps) {
  const gradient = thumbGradients[course.thumbnail] ?? 'from-stone-600 to-stone-900'

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-stone-200 bg-white p-5 transition-all hover:border-stone-300 hover:shadow-[0_4px_20px_-4px_rgba(10,10,10,0.08)] lg:flex-row lg:items-center">
      <div className={`flex h-16 w-24 shrink-0 items-end rounded-lg bg-gradient-to-br ${gradient} p-2`}>
        <span className="line-clamp-2 text-[9px] font-bold text-white/90 leading-tight">{course.title.split(' ').slice(0, 3).join(' ')}</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-base font-bold text-ink">{course.title}</h3>
          <StatusBadge status={course.status} />
          {course.visibility === 'private' && <StatusBadge status="private" />}
        </div>
        <p className="mt-0.5 text-sm text-ink-3">{course.category} · {course.level} · {course.duration}</p>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-ink-3">
          <span>{course.students} students</span>
          <span>★ {course.rating || '—'}</span>
          <span>{course.revenue}</span>
          <span>Updated {course.updatedAt}</span>
        </div>
        {course.status === 'published' && (
          <div className="mt-3 max-w-xs">
            <ProgressBar value={course.completion} size="sm" />
            <p className="mt-1 text-xs text-ink-3">{course.completion}% avg. completion</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 lg:flex-col lg:items-stretch">
        <Link to={`/instructor/courses/${course.id}/edit`} className="btn-primary text-center text-sm">Edit course</Link>
        <Link to={`/instructor/courses/${course.id}/preview`} className="btn-secondary text-center text-sm">Preview</Link>
        <Link to={`/instructor/courses/${course.id}/edit?tab=curriculum`} className="btn-ghost text-center text-sm">Curriculum</Link>
      </div>
    </div>
  )
}

export function CoursePreviewHero({ course }: { course: InstructorCourse }) {
  const gradient = thumbGradients[course.banner || course.thumbnail] ?? 'from-forest-800 to-forest-900'
  return (
    <div className={`rounded-xl bg-gradient-to-br ${gradient} px-8 py-12 text-white`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/60">{course.category}</p>
      <h1 className="mt-2 font-display text-2xl font-bold md:text-3xl">{course.title}</h1>
      <p className="mt-2 max-w-2xl text-white/80">{course.subtitle}</p>
      <div className="mt-4 flex flex-wrap gap-3 text-sm text-white/70">
        <span>{course.level}</span>
        <span>·</span>
        <span>{course.duration}</span>
        <span>·</span>
        <span>{course.price}</span>
        {course.coachingIncluded && <span className="rounded-md bg-white/20 px-2 py-0.5 text-xs font-semibold">Coaching included</span>}
      </div>
    </div>
  )
}
