import type { Certification } from '../../data/homepageData'

interface CertificationBadgeProps {
  certification: Certification
}

export function CertificationBadge({ certification }: CertificationBadgeProps) {
  return (
    <div className="group flex items-start gap-4 rounded-xl border border-stone-200 bg-white p-5 transition-colors hover:border-forest-200 hover:bg-forest-50/30">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-stone-50 text-sm font-bold text-ink group-hover:bg-white">
        {certification.provider.charAt(0)}
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-ink-3">
          {certification.category}
        </p>
        <h3 className="mt-1 text-sm font-semibold text-ink">{certification.name}</h3>
        <p className="mt-0.5 text-xs text-ink-2">{certification.provider}</p>
      </div>
    </div>
  )
}
