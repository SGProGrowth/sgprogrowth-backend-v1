import { Link } from 'react-router-dom'
import type { EnrolledCourse } from '../../data/studentData'
import { ProgressBar } from './ProgressBar'
import { Button } from '../ui/Button'

const thumbnailStyles: Record<string, string> = {
  cloud: 'from-sky-600 to-blue-800',
  project: 'from-violet-600 to-purple-800',
  data: 'from-emerald-600 to-teal-800',
  coaching: 'from-amber-500 to-orange-700',
}

interface CourseThumbnailProps {
  type: string
  title: string
  size?: 'sm' | 'md' | 'lg'
}

export function CourseThumbnail({ type, title, size = 'md' }: CourseThumbnailProps) {
  const gradient = thumbnailStyles[type] ?? 'from-stone-600 to-stone-800'
  const sizeClass = size === 'sm' ? 'h-14 w-20' : size === 'lg' ? 'h-28 w-full' : 'h-20 w-28'

  return (
    <div
      className={`shrink-0 rounded-lg bg-gradient-to-br ${gradient} ${sizeClass} flex items-end p-2`}
      aria-hidden="true"
    >
      <span className="line-clamp-2 text-[10px] font-semibold leading-tight text-white/90">{title.split(' ').slice(0, 3).join(' ')}</span>
    </div>
  )
}

interface EnrolledCourseCardProps {
  course: EnrolledCourse
  variant?: 'default' | 'compact'
}

export function EnrolledCourseCard({ course, variant = 'default' }: EnrolledCourseCardProps) {
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-4 rounded-lg border border-stone-200 bg-white p-4 transition-shadow hover:shadow-[0_4px_20px_-4px_rgba(10,10,10,0.08)]">
        <CourseThumbnail type={course.thumbnail} title={course.title} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-ink">{course.title}</p>
          <p className="text-xs text-ink-3 mt-0.5">{course.modulesCompleted}/{course.totalModules} modules · Coach: {course.coach}</p>
          <div className="mt-2 max-w-xs">
            <ProgressBar value={course.progress} size="sm" />
          </div>
        </div>
        <span className="shrink-0 text-sm font-bold text-forest-800">{course.progress}%</span>
      </div>
    )
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white transition-all hover:border-stone-300 hover:shadow-[0_8px_30px_-8px_rgba(10,10,10,0.12)]">
      <div className="relative">
        <CourseThumbnail type={course.thumbnail} title={course.title} size="lg" />
        {course.status === 'completed' && (
          <span className="absolute right-3 top-3 rounded-md bg-white/95 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-forest-800 shadow-sm">
            Completed
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-forest-700">{course.category}</p>
        <h3 className="mt-1 font-display text-base font-bold text-ink line-clamp-2">{course.title}</h3>
        <p className="mt-1 text-xs text-ink-3">Coach: {course.coach} · {course.level}</p>

        <div className="mt-4">
          <div className="mb-1.5 flex justify-between text-xs">
            <span className="font-medium text-ink-2">{course.modulesCompleted} of {course.totalModules} modules</span>
            <span className="font-bold text-forest-800">{course.progress}%</span>
          </div>
          <ProgressBar value={course.progress} />
        </div>

        {course.status === 'active' && (
          <p className="mt-3 text-xs text-ink-3">
            <span className="font-medium text-ink-2">Next:</span> {course.nextLesson}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-4">
          <span className="text-xs text-ink-3">Last accessed {course.lastAccessed}</span>
          {course.status === 'active' ? (
            <Button to={`/courses/${course.id}`} variant="primary" size="sm">Continue</Button>
          ) : (
            <Button to="/dashboard/certificates" variant="secondary" size="sm">View certificate</Button>
          )}
        </div>
      </div>
    </article>
  )
}

interface RecommendedCourseCardProps {
  course: {
    id: string
    title: string
    instructor: string
    category: string
    level: string
    duration: string
    rating: number
    reviewCount: number
    price?: string
    badge?: string
    reason: string
  }
}

export function RecommendedCourseCard({ course }: RecommendedCourseCardProps) {
  return (
    <div className="flex gap-4 rounded-xl border border-stone-200 bg-stone-50/50 p-4 md:p-5">
      <CourseThumbnail type="cloud" title={course.title} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gold-600">{course.reason}</p>
        <h4 className="mt-0.5 font-display text-sm font-bold text-ink">{course.title}</h4>
        <p className="text-xs text-ink-3 mt-0.5">{course.instructor} · ★ {course.rating} ({course.reviewCount})</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-medium text-ink-3 border border-stone-200">{course.level}</span>
          <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-medium text-ink-3 border border-stone-200">{course.duration}</span>
          {course.price && <span className="text-xs font-bold text-ink">{course.price}</span>}
        </div>
      </div>
      <Link
        to={`/courses/${course.id}`}
        className="shrink-0 self-center rounded-md bg-forest-800 px-4 py-2 text-xs font-semibold text-white hover:bg-forest-900 transition-colors"
      >
        View
      </Link>
    </div>
  )
}

interface ContinueLearningProps {
  course: EnrolledCourse
}

export function ContinueLearningCard({ course }: ContinueLearningProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-forest-200 bg-gradient-to-br from-forest-900 via-forest-800 to-forest-900 text-white">
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5" />
      <div className="absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-white/5" />
      <div className="relative p-6 md:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-forest-200">Continue learning</p>
        <h3 className="mt-2 font-display text-xl font-bold md:text-2xl">{course.title}</h3>
        <p className="mt-2 text-sm text-white/70">
          Pick up at <span className="font-medium text-white">{course.nextLesson}</span>
        </p>
        <div className="mt-5">
          <div className="mb-2 flex justify-between text-xs">
            <span className="text-white/70">{course.modulesCompleted}/{course.totalModules} modules complete</span>
            <span className="font-bold">{course.progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/20">
            <div className="h-full rounded-full bg-gold-500 transition-all" style={{ width: `${course.progress}%` }} />
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to={`/courses/${course.id}`}
            className="inline-flex items-center rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-forest-900 hover:bg-stone-50 transition-colors"
          >
            Resume course
          </Link>
          <Link
            to="/dashboard/progress"
            className="inline-flex items-center rounded-md border border-white/30 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
          >
            View progress
          </Link>
        </div>
      </div>
    </div>
  )
}
