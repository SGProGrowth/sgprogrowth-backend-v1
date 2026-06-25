import type { Certification } from '../../data/homepageData'

interface CertificationBadgeProps {
  certification: Certification
}

export function CertificationBadge({ certification }: CertificationBadgeProps) {
  return (
    <div className="group flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-brand-200 hover:bg-brand-50/30">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-sm font-bold text-navy-900 group-hover:bg-white">
        {certification.provider.charAt(0)}
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
          {certification.category}
        </p>
        <h3 className="mt-1 text-sm font-semibold text-navy-900">{certification.name}</h3>
        <p className="mt-0.5 text-xs text-slate-700">{certification.provider}</p>
      </div>
    </div>
  )
}
