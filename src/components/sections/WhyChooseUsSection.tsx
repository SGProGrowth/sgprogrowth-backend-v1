import { whyChooseUs } from '../../data/homepageData'
import { Container } from '../layout/Container'
import { SectionHeader } from '../layout/SectionHeader'

export function WhyChooseUsSection() {
  return (
    <section className="section-padding bg-white section-rule">
      <Container>
        <SectionHeader
          eyebrow="Why SG Pro Growth"
          title="A coaching-first model that changes outcomes"
          description="We don't sell courses in isolation. Every learner gets direction, accountability, and support through to career application."
        />

        <div className="grid gap-px bg-stone-200 border border-stone-200 rounded-lg overflow-hidden md:grid-cols-2 lg:grid-cols-3">
          {whyChooseUs.map((item, i) => (
            <article key={item.title} className={`bg-white p-8 ${i === 0 ? 'md:col-span-2 lg:col-span-1' : ''}`}>
              <span className="font-display text-3xl font-bold text-stone-200">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="mt-4 text-[15px] font-bold text-ink">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-3">{item.description}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  )
}
