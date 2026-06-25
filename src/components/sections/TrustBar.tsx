import { trustPartners } from '../../data/homepageData'
import { Container } from '../layout/Container'

export function TrustBar() {
  return (
    <section aria-label="Trusted organizations" className="section-rule bg-white py-8">
      <Container>
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          <p className="text-sm font-medium text-ink-3 shrink-0">Trusted by teams at</p>
          <ul role="list" className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {trustPartners.map((p) => (
              <li key={p.name}>
                {p.logo ? (
                  <img src={p.logo} alt={p.name} className="h-6 w-auto opacity-40 grayscale hover:opacity-70 hover:grayscale-0 transition-all" />
                ) : (
                  <span className="text-sm text-ink-4">{p.name}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  )
}
