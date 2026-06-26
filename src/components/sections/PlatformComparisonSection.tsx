import { sgProGrowthPoints, traditionalPlatformPoints } from '../../data/homepageData'
import { Container } from '../layout/Container'
import { SectionHeader } from '../layout/SectionHeader'
import { Button } from '../ui/Button'

export function PlatformComparisonSection() {
  return (
    <section className="section-padding-sm bg-white section-rule">
      <Container>
        <SectionHeader eyebrow="The difference" title="Why coaching-led learning wins" align="center" />
        <div className="mx-auto max-w-3xl grid md:grid-cols-2 gap-px bg-stone-200 border border-stone-200 rounded-lg overflow-hidden">
          <div className="bg-stone-50 p-8">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-4 mb-5">Traditional platforms</p>
            <ul className="space-y-3">
              {traditionalPlatformPoints.map((p) => (
                <li key={p} className="flex gap-3 text-sm text-ink-3">
                  <span className="text-ink-4 shrink-0">—</span>{p}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-forest-900 p-8">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-forest-200 mb-5">SG Pro Growth</p>
            <ul className="space-y-3">
              {sgProGrowthPoints.map((p) => (
                <li key={p} className="flex gap-3 text-sm text-stone-200">
                  <span className="text-gold-500 shrink-0 font-bold">✓</span>{p}
                </li>
              ))}
            </ul>
            <Button to="/register" variant="gold" size="md" className="mt-8">Get started free</Button>
          </div>
        </div>
      </Container>
    </section>
  )
}
