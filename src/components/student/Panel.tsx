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
      <div className="flex items-center justify-between gap-4 border-b border-stone-100 px-5 py-4 md:px-6">
        <h2 className="font-display text-[15px] font-bold text-ink">{title}</h2>
        {action}
      </div>
      <div className={noPadding ? '' : 'p-5 md:p-6'}>{children}</div>
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
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="text-label mb-2">{eyebrow}</p>}
        <h1 className="text-display-lg text-ink">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-body-lg">{description}</p>}
      </div>
      {action}
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
    <div className={`mb-6 flex gap-1 overflow-x-auto border-b border-stone-200 pb-px ${className}`} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
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
    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-[0_1px_2px_rgba(10,10,10,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wider text-ink-3">{label}</p>
        {icon && <div className="text-forest-700">{icon}</div>}
      </div>
      <p className="mt-2 font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">{value}</p>
      {hint && <p className="mt-1 text-sm text-ink-3">{hint}</p>}
    </div>
  )
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-300 bg-stone-50/50 px-6 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-stone-200/80">
        <svg className="h-6 w-6 text-ink-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5a1.125 1.125 0 00-1.125-1.125H3.375a1.125 1.125 0 00-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      </div>
      <p className="font-display text-base font-bold text-ink">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-ink-3">{description}</p>
    </div>
  )
}
