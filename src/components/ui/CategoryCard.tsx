import type { Category } from '../../data/homepageData'

const icons: Record<Category['icon'], string> = {
  project: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  cloud: 'M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z',
  data: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  coaching: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  software: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
}

interface CategoryCardProps {
  category: Category
  compact?: boolean
}

export function CategoryCard({ category, compact = false }: CategoryCardProps) {
  const href = '#courses'

  if (compact) {
    return (
      <a href={href} className="inline-flex shrink-0 items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-ink hover:border-stone-300">
        {category.title}
      </a>
    )
  }

  return (
    <a href={href} className="card-interactive group block p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-stone-100 text-ink-2 group-hover:bg-forest-800 group-hover:text-white transition-colors">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d={icons[category.icon]} />
        </svg>
      </div>
      <h3 className="mt-4 text-[15px] font-bold text-ink">{category.title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-ink-3">{category.description}</p>
      <p className="mt-4 text-xs font-semibold text-forest-800">{category.courseCount} courses</p>
    </a>
  )
}
