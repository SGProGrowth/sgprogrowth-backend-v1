import { howItWorksSteps } from '../../data/homepageData'
import { Container } from '../layout/Container'
import { SectionHeader } from '../layout/SectionHeader'

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="section-padding bg-stone-50">
      <Container>
        <SectionHeader
          eyebrow="How it works"
          title="Four steps from clarity to career growth"
          align="center"
        />
        <ol className="mx-auto max-w-4xl grid gap-8 md:grid-cols-4 md:gap-6">
          {howItWorksSteps.map((step, i) => (
            <li key={step.number} className="relative text-center md:text-left">
              {i < howItWorksSteps.length - 1 && (
                <div className="hidden md:block absolute top-5 left-[calc(50%+20px)] right-0 h-px bg-stone-300 lg:left-[calc(50%+24px)]" aria-hidden="true" />
              )}
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-forest-800 text-sm font-bold text-forest-800">
                {step.number}
              </span>
              <h3 className="mt-4 text-[15px] font-bold text-ink">{step.title}</h3>
              <p className="mt-1.5 text-sm text-ink-3 leading-relaxed">{step.description}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  )
}
