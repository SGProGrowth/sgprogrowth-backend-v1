import type { ReactNode } from 'react'
import type { Metric } from '../../data/homepageData'

const iconMap: Record<Metric['icon'], ReactNode> = {
  learners: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  ),
  programs: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  ),
  completion: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  enterprise: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-16.5-3v3m3-3v3m3-3v3m3-3v3m3-3v3M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12m-8.25-10.5V21m16.5-15.75V21" />
    </svg>
  ),
}

interface MetricCardProps {
  metric: Metric
  variant?: 'light' | 'dark'
  compact?: boolean
}

export function MetricCard({ metric, variant = 'light', compact = false }: MetricCardProps) {
  const isDark = variant === 'dark'

  return (
    <div className={`${compact ? 'space-y-2' : 'space-y-3'} ${isDark ? 'text-white' : ''}`}>
      <div
        className={`inline-flex items-center justify-center rounded-xl ${
          isDark
            ? 'bg-brand-500/20 text-brand-300'
            : 'bg-brand-50 text-brand-600'
        } ${compact ? 'h-10 w-10' : 'h-12 w-12'}`}
      >
        {iconMap[metric.icon]}
      </div>
      <div>
        <p
          className={`font-display font-bold tracking-tight ${
            compact ? 'text-3xl' : 'text-4xl md:text-5xl'
          } ${isDark ? 'text-white' : 'text-brand-600'}`}
        >
          {metric.value}
        </p>
        <p className={`mt-1 font-semibold ${compact ? 'text-sm' : 'text-base'} ${isDark ? 'text-white' : 'text-navy-900'}`}>
          {metric.label}
        </p>
        <p className={`mt-0.5 text-sm ${isDark ? 'text-navy-300' : 'text-navy-600'}`}>
          {metric.description}
        </p>
      </div>
    </div>
  )
}
