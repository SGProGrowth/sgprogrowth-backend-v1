import { testimonials } from '../../data/homepageData'
import { Container } from '../layout/Container'
import { SectionHeader } from '../layout/SectionHeader'
import { TestimonialCard } from '../ui/TestimonialCard'

export function TestimonialsSection() {
  return (
    <section className="section-padding bg-white section-rule">
      <Container>
        <SectionHeader
          eyebrow="Learner stories"
          title="Professionals who chose clarity"
          align="center"
        />
        <div className="grid gap-5 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <TestimonialCard key={t.name} testimonial={t} featured={i === 1} />
          ))}
        </div>
      </Container>
    </section>
  )
}
