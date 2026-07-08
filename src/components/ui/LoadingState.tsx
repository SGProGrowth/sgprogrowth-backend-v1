import { BrandLogo } from '../brand/BrandLogo'

interface LoadingStateProps {
  label?: string
  className?: string
  showLogo?: boolean
}

export function LoadingState({ label = 'Loading…', className = '', showLogo = true }: LoadingStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border border-stone-200 bg-white px-6 py-16 text-center ${className}`}
      role="status"
      aria-live="polite"
    >
      {showLogo && (
        <div className="mb-6">
          <BrandLogo variant="loading" to="" />
        </div>
      )}
      <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-forest-700" />
      <p className="text-sm font-medium text-ink-3">{label}</p>
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="animate-rise space-y-6" aria-hidden="true">
      <div className="h-32 rounded-2xl bg-stone-200/60" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-stone-200/60" />
        ))}
      </div>
      <div className="h-64 rounded-xl bg-stone-200/60" />
    </div>
  )
}
