import { trustMetrics, industryImpact } from '../../data/homepageData'
import { Container } from '../layout/Container'

export function SuccessMetricsSection() {
  return (
    <section className="section-padding-sm bg-stone-900 text-white">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-20 items-start">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400 mb-4">Platform impact</p>
            <h2 className="text-display-lg text-white mb-10">Built for measurable career outcomes</h2>
            <div className="grid grid-cols-2 gap-8">
              {trustMetrics.map((m) => (
                <div key={m.label}>
                  <p className="font-display text-4xl font-bold text-white tracking-tight">{m.value}</p>
                  <p className="mt-1 text-sm font-medium text-stone-300">{m.label}</p>
                  <p className="mt-0.5 text-xs text-stone-500">{m.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-stone-700 rounded-lg p-8 md:p-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400 mb-6">Industry outcomes</p>
            <div className="space-y-6">
              {industryImpact.map((item) => (
                <div key={item.label} className="flex gap-5 items-baseline border-b border-stone-800 pb-6 last:border-0 last:pb-0">
                  <span className="font-display text-3xl font-bold text-gold-500 shrink-0 w-20">{item.stat}</span>
                  <div>
                    <p className="font-medium text-white text-[15px]">{item.label}</p>
                    <p className="text-sm text-stone-400 mt-0.5">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
