import { featuredCertifications } from '../../data/homepageData'
import { Container } from '../layout/Container'
import { SectionHeader } from '../layout/SectionHeader'
import { Button } from '../ui/Button'

export function LearningPathsSection() {
  return (
    <section id="certifications" className="section-padding bg-stone-50">
      <Container>
        <SectionHeader
          eyebrow="Certifications & outcomes"
          title="Credentials that advance careers"
          description="Structured paths with exam prep, coaching, and career support — aligned to roles employers are hiring for."
          action={<Button href="/courses" variant="outline" size="md">All paths</Button>}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featuredCertifications.map((cert) => (
            <a
              key={cert.name}
              href="#courses"
              className="card-interactive block p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-4">{cert.provider}</p>
              <h3 className="mt-2 text-[15px] font-bold text-ink">{cert.name}</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded px-2 py-0.5 text-[11px] font-medium bg-stone-100 text-ink-2">{cert.duration}</span>
                <span className="rounded px-2 py-0.5 text-[11px] font-medium bg-forest-50 text-forest-800">{cert.outcome}</span>
              </div>
              <p className="mt-5 text-xs text-ink-3 border-t border-stone-100 pt-4">{cert.learners} learners worldwide</p>
            </a>
          ))}
        </div>
      </Container>
    </section>
  )
}
