import type { ReactNode } from 'react'
import { NavIconSvg } from './NavIcon'
import type { NavIcon } from '../../data/dashboardData'

interface FeaturePlaceholderProps {
  icon: NavIcon
  title: string
  description: string
  features: string[]
  action?: ReactNode
}

export function FeaturePlaceholder({ icon, title, description, features, action }: FeaturePlaceholderProps) {
  return (
    <div className="animate-rise">
      <div className="rounded-lg border border-stone-200 bg-white overflow-hidden">
        <div className="border-b border-stone-200 bg-stone-50 px-6 py-8 md:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-forest-50 text-forest-700">
                <NavIconSvg icon={icon} className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-display-md text-ink">{title}</h1>
                <p className="mt-2 max-w-2xl text-body-lg">{description}</p>
              </div>
            </div>
            {action}
          </div>
        </div>

        <div className="p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-3 mb-4">Coming soon</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-3 rounded-md border border-dashed border-stone-300 bg-stone-50/50 px-4 py-3.5"
              >
                <span className="flex h-2 w-2 shrink-0 rounded-full bg-stone-300" />
                <span className="text-sm font-medium text-ink-2">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
