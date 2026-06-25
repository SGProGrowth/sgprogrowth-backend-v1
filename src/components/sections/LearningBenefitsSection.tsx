import {
  learningBenefits,
  problemPoints,
  solutionPoints,
} from '../../data/homepageData'
import { Container } from '../layout/Container'
import { SectionHeader } from '../layout/SectionHeader'

export function LearningBenefitsSection() {
  return (
    <section className="section-padding bg-white">
      <Container>
        <SectionHeader
          eyebrow="The SG Pro Growth difference"
          title="Learning Benefits"
          description="A coaching-first approach that puts clarity, accountability, and career outcomes ahead of content volume."
        />

        <div className="grid gap-5 md:grid-cols-3">
          {learningBenefits.map((benefit, index) => (
            <article
              key={benefit.title}
              className="rounded-xl border border-slate-200 bg-surface p-6"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-navy-900 text-xs font-bold text-white">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-4 text-base font-semibold text-navy-900">{benefit.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {benefit.description}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <div className="rounded-xl border border-red-100 bg-red-50/40 p-6 md:p-8">
            <h3 className="text-base font-semibold text-navy-900">
              Why Online Courses Alone Don&apos;t Work
            </h3>
            <ul className="mt-5 space-y-3">
              {problemPoints.map((point) => (
                <li key={point} className="flex gap-3 text-sm text-slate-600">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-[10px] font-bold text-red-600"
                    aria-hidden="true"
                  >
                    ✕
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-6 md:p-8">
            <h3 className="text-base font-semibold text-navy-900">
              How SG Pro Growth Changes Everything
            </h3>
            <ul className="mt-5 space-y-3">
              {solutionPoints.map((point) => (
                <li key={point} className="flex gap-3 text-sm text-slate-600">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-600"
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  )
}
