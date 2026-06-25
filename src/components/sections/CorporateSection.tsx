import { corporateBenefits } from '../../data/homepageData'
import { Container } from '../layout/Container'
import { Button } from '../ui/Button'

export function CorporateSection() {
  return (
    <section id="enterprise" className="section-padding bg-stone-900 text-white">
      <Container>
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20 items-center">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400 mb-4">For business</p>
            <h2 className="text-display-lg text-white">Enterprise learning that teams actually complete</h2>
            <p className="mt-5 text-[15px] leading-relaxed text-stone-300">
              Most corporate training fails because employees enroll without direction. SG Pro Growth
              aligns workforce development with business goals through coaching-led programs and measurable KPIs.
            </p>
            <ul className="mt-8 space-y-3">
              {corporateBenefits.map((b) => (
                <li key={b} className="flex gap-3 text-sm text-stone-200">
                  <span className="text-gold-500 font-bold shrink-0">✓</span>{b}
                </li>
              ))}
            </ul>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button href="#contact" variant="gold" size="lg">Request demo</Button>
              <Button href="#contact" variant="secondary" size="lg" className="border-stone-600 bg-transparent text-white hover:bg-stone-800 hover:border-stone-500">
                Contact sales
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { title: 'Custom paths', desc: 'Aligned to org goals' },
              { title: 'Success manager', desc: 'Dedicated support' },
              { title: 'Analytics', desc: 'Team dashboards' },
              { title: 'Volume pricing', desc: 'Any team size' },
            ].map((f) => (
              <div key={f.title} className="rounded-lg border border-stone-700 p-5">
                <p className="text-sm font-bold text-white">{f.title}</p>
                <p className="text-xs text-stone-400 mt-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
