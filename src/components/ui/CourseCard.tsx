import { Link } from 'react-router-dom'
import type { Course } from '../../data/homepageData'
import { Rating } from './Rating'

interface CourseCardProps {
  course: Course
}

const thumbColors = [
  'bg-forest-800',
  'bg-stone-800',
  'bg-gold-700',
  'bg-stone-700',
  'bg-forest-900',
  'bg-stone-900',
]

function getThumbColor(id: string) {
  return thumbColors[id.length % thumbColors.length]
}

export function CourseCard({ course }: CourseCardProps) {
  const url = `/courses/${course.id}`

  return (
    <article className="card-interactive flex h-full flex-col overflow-hidden group">
      <Link to={url} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600 focus-visible:ring-inset">
        <div className={`relative aspect-[16/9] ${getThumbColor(course.id)}`}>
          <div className="absolute inset-0 flex flex-col justify-between p-4">
            <div className="flex gap-2">
              {course.isNew && <span className="rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-white text-ink">New</span>}
              {course.trending && <span className="rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-gold-500 text-white">Trending</span>}
            </div>
            <span className="inline-flex w-fit rounded px-2 py-1 text-[11px] font-medium bg-white/90 text-ink">{course.category}</span>
          </div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <Link to={url} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600 rounded-sm">
          <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-ink group-hover:text-forest-800 transition-colors">
            {course.title}
          </h3>
        </Link>
        <p className="mt-1 text-xs text-ink-3">{course.instructor}</p>
        <div className="mt-3"><Rating rating={course.rating} reviewCount={course.reviewCount} /></div>
        <p className="mt-2 text-xs text-ink-3">{course.duration}{course.learners ? ` · ${course.learners} learners` : ''}</p>

        <div className="mt-auto pt-4 flex items-center justify-between border-t border-stone-100">
          {course.price
            ? <span className="text-base font-bold text-ink">{course.price}</span>
            : <span className="text-sm font-medium text-forest-700">Free consultation</span>}
          <Link to={url} className="text-sm font-semibold text-forest-800 hover:text-forest-900 underline decoration-forest-200 underline-offset-4 transition-colors">
            {course.price ? 'Enroll' : course.ctaLabel} →
          </Link>
        </div>
      </div>
    </article>
  )
}
