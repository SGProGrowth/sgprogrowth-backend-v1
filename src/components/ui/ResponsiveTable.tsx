import type { ReactNode } from 'react'

/** Horizontal scroll wrapper — prevents page-level overflow on small screens */
export function ResponsiveTable({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`table-scroll ${className}`}>
      {children}
    </div>
  )
}

interface MobileCardField {
  label: string
  value: ReactNode
}

export function MobileDataCard({
  title,
  subtitle,
  badge,
  fields,
  actions,
}: {
  title: ReactNode
  subtitle?: ReactNode
  badge?: ReactNode
  fields: MobileCardField[]
  actions?: ReactNode
}) {
  return (
    <article className="rounded-xl border border-stone-200 bg-white p-4 shadow-[0_1px_2px_rgba(10,10,10,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-ink">{title}</div>
          {subtitle && <div className="mt-0.5 text-sm text-ink-3">{subtitle}</div>}
        </div>
        {badge}
      </div>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.label}>
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-ink-4">{field.label}</dt>
            <dd className="mt-0.5 text-sm text-ink-2">{field.value}</dd>
          </div>
        ))}
      </dl>
      {actions && <div className="mt-4 flex flex-wrap gap-2 border-t border-stone-100 pt-4">{actions}</div>}
    </article>
  )
}
