import type { ReactNode } from 'react'

interface PanelProps {
  title: string
  action?: ReactNode
  children: ReactNode
  className?: string
  noPadding?: boolean
}

export function Panel({ title, action, children, className = '', noPadding = false }: PanelProps) {
  return (
    <section className={`rounded-xl border border-stone-200 bg-white shadow-[0_1px_2px_rgba(10,10,10,0.04)] ${className}`}>
      <div className="flex flex-col gap-3 border-b border-stone-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 md:px-6">
        <h2 className="font-display text-[15px] font-bold text-ink">{title}</h2>
        {action}
      </div>
      <div className={noPadding ? '' : 'p-4 sm:p-5 md:p-6'}>{children}</div>
    </section>
  )
}

interface PageIntroProps {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
}

export function PageIntro({ eyebrow, title, description, action }: PageIntroProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="text-label mb-2">{eyebrow}</p>}
        <h1 className="text-display-lg text-ink">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-body-lg">{description}</p>}
      </div>
      {action && <div className="page-actions shrink-0">{action}</div>}
    </div>
  )
}

interface TabItem {
  id: string
  label: string
  count?: number
}

interface TabBarProps {
  tabs: TabItem[]
  active: string
  onChange: (id: string) => void
  className?: string
}

export function TabBar({ tabs, active, onChange, className = '' }: TabBarProps) {
  return (
    <div
      className={`mb-6 flex gap-1 overflow-x-auto scroll-touch border-b border-stone-200 pb-px -mx-1 px-1 ${className}`}
      role="tablist"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={`shrink-0 min-h-11 rounded-t-md border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600 focus-visible:ring-offset-2 sm:px-4 ${
            active === tab.id
              ? 'border-forest-700 text-forest-800'
              : 'border-transparent text-ink-3 hover:text-ink-2'
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] ${
              active === tab.id ? 'bg-forest-100 text-forest-800' : 'bg-stone-100 text-ink-3'
            }`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

interface StatTileProps {
  label: string
  value: string | number
  hint?: string
  icon?: ReactNode
}

export function StatTile({ label, value, hint, icon }: StatTileProps) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-[0_1px_2px_rgba(10,10,10,0.04)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wider text-ink-3">{label}</p>
        {icon && <div className="text-forest-700">{icon}</div>}
      </div>
      <p className="mt-2 font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">{value}</p>
      {hint && <p className="mt-1 text-sm text-ink-3">{hint}</p>}
    </div>
  )
}

export function EmptyState({
  title,
  description,
  action,
  icon = 'default',
}: {
  title: string
  description: string
  action?: ReactNode
  icon?: 'default' | 'calendar' | 'bell' | 'document' | 'quiz'
}) {
  const icons = {
    default: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5a1.125 1.125 0 00-1.125-1.125H3.375a1.125 1.125 0 00-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z',
    calendar: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5',
    bell: 'M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0',
    document: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
    quiz: 'M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z',
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-300 bg-stone-50/50 px-6 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-stone-200/80">
        <svg className="h-6 w-6 text-ink-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d={icons[icon]} />
        </svg>
      </div>
      <p className="font-display text-base font-bold text-ink">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-ink-3">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
