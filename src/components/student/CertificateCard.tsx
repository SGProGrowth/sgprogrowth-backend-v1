import type { Certificate } from '../../data/studentData'
import { Button } from '../ui/Button'

interface CertificateCardProps {
  certificate: Certificate
}

export function CertificateCard({ certificate }: CertificateCardProps) {
  return (
    <article className="overflow-hidden rounded-xl border border-stone-200 bg-white transition-all hover:shadow-[0_8px_30px_-8px_rgba(10,10,10,0.12)]">
      <div className="relative bg-gradient-to-br from-forest-800 via-forest-900 to-ink px-6 py-8 text-white">
        <div className="absolute right-4 top-4 opacity-20">
          <svg className="h-16 w-16" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-forest-200">Certificate of Completion</p>
        <h3 className="mt-3 font-display text-lg font-bold leading-snug">{certificate.title}</h3>
        <p className="mt-2 text-sm text-white/70">Issued {certificate.issuedDate}</p>
      </div>
      <div className="p-5">
        <p className="text-xs text-ink-3">Instructor: {certificate.instructor}</p>
        <p className="text-xs text-ink-4 mt-1 font-mono">ID: {certificate.credentialId}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {certificate.skills.map((skill) => (
            <span key={skill} className="rounded-md bg-forest-50 px-2 py-0.5 text-[10px] font-semibold text-forest-800">
              {skill}
            </span>
          ))}
        </div>
        <div className="mt-4 flex gap-2 border-t border-stone-100 pt-4">
          <Button variant="primary" size="sm">Download PDF</Button>
          <Button variant="secondary" size="sm">Share on LinkedIn</Button>
        </div>
      </div>
    </article>
  )
}

interface TimelineEvent {
  date: string
  event: string
  type: 'certificate' | 'enrollment' | 'achievement' | 'upcoming'
}

export function AchievementTimeline({ events }: { events: TimelineEvent[] }) {
  const dotColors = {
    certificate: 'bg-forest-700',
    enrollment: 'bg-blue-500',
    achievement: 'bg-gold-500',
    upcoming: 'bg-stone-300',
  }

  return (
    <div className="space-y-0">
      {events.map((item, idx) => (
        <div key={`${item.date}-${item.event}`} className="relative flex gap-4 pb-6 last:pb-0">
          {idx < events.length - 1 && (
            <div className="absolute left-[7px] top-4 h-full w-px bg-stone-200" />
          )}
          <span className={`relative z-10 mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full ${dotColors[item.type]}`} />
          <div>
            <p className="text-xs font-semibold text-ink-4">{item.date}</p>
            <p className="text-sm font-medium text-ink-2 mt-0.5">{item.event}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
