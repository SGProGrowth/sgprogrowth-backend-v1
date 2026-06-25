import { certifications } from '../../data/homepageData'
import { Container } from '../layout/Container'
import { SectionHeader } from '../layout/SectionHeader'
import { CertificationBadge } from '../ui/CertificationBadge'
import { Button } from '../ui/Button'

export function CertificationsSection() {
  return (
    <section id="certifications" className="section-padding bg-premium-pattern">
      <Container>
        <SectionHeader
          eyebrow="Industry credentials"
          title="Certifications We Prepare You For"
          description="Industry-recognised certifications aligned with your career roadmap and coaching guidance."
          action={
            <Button href="#certifications" variant="outline" size="sm">
              Explore paths
            </Button>
          }
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {certifications.map((cert) => (
            <CertificationBadge key={cert.name} certification={cert} />
          ))}
        </div>
      </Container>
    </section>
  )
}
