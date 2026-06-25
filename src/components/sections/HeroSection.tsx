import { searchSuggestions, trustMetrics } from '../../data/homepageData'
import { Container } from '../layout/Container'
import { Button } from '../ui/Button'
import { SearchBar } from '../ui/SearchBar'

export function HeroSection() {
  return (
    <section className="bg-stone-50 border-b border-stone-200">
      <Container className="py-14 md:py-20 lg:py-24">
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16 xl:gap-20">
          {/* Copy */}
          <div className="animate-rise max-w-xl">
            <p className="text-label mb-5">Coaching-led learning platform</p>
            <h1 className="text-display-xl text-ink">
              Coaching before you learn.{' '}
              <span className="text-forest-800">Clarity before you certify.</span>
            </h1>
            <p className="mt-6 text-body-lg max-w-lg">
              SG Pro Growth pairs expert coaching with structured programs so professionals
              and enterprise teams achieve career outcomes — not just course completions.
            </p>

            <div className="mt-8 max-w-md">
              <SearchBar size="lg" suggestions={searchSuggestions} placeholder="What skill do you want to build?" />
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="#signup" variant="gold" size="lg">
                Start free coaching session
              </Button>
              <Button href="#enterprise" variant="secondary" size="lg">
                For teams
              </Button>
            </div>

            <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3 border-t border-stone-200 pt-8">
              {trustMetrics.slice(0, 3).map((m) => (
                <li key={m.label}>
                  <p className="font-display text-2xl font-bold text-ink tracking-tight">{m.value}</p>
                  <p className="text-xs text-ink-3 mt-0.5">{m.label}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Product preview — clean, no glass/gradients */}
          <div className="animate-rise lg:pt-4" style={{ animationDelay: '100ms' }}>
            <div className="rounded-lg border border-stone-200 bg-white shadow-[0_2px_40px_rgba(10,10,10,0.08)] overflow-hidden">
              {/* Window chrome */}
              <div className="flex items-center gap-2 border-b border-stone-200 bg-stone-50 px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
                <span className="ml-3 text-xs font-medium text-ink-3">My Learning Dashboard</span>
              </div>

              <div className="p-6 md:p-8">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <p className="text-xs font-medium text-ink-3 uppercase tracking-wider">Active program</p>
                    <p className="mt-1 text-lg font-bold text-ink">AWS Solutions Architect</p>
                    <p className="text-sm text-ink-3 mt-0.5">Week 6 of 10 · Coach: Mahesh M.</p>
                  </div>
                  <span className="shrink-0 rounded-md bg-forest-50 px-2.5 py-1 text-xs font-semibold text-forest-800">
                    68% complete
                  </span>
                </div>

                <div className="h-1.5 rounded-full bg-stone-100 mb-8">
                  <div className="h-full w-[68%] rounded-full bg-forest-700" />
                </div>

                <p className="text-xs font-semibold uppercase tracking-wider text-ink-3 mb-3">This week</p>
                <div className="space-y-2">
                  {[
                    { label: '1:1 Coaching session', meta: 'Tomorrow · 3:00 PM', live: true },
                    { label: 'Module 4: VPC & Networking', meta: 'Self-paced · 2 hrs', live: false },
                    { label: 'Practice exam review', meta: 'Friday · 11:00 AM', live: true },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center gap-3 rounded-md border border-stone-200 px-4 py-3">
                      <span className={`flex h-2 w-2 shrink-0 rounded-full ${row.live ? 'bg-gold-500' : 'bg-stone-300'}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink truncate">{row.label}</p>
                        <p className="text-xs text-ink-3">{row.meta}</p>
                      </div>
                      {row.live && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-gold-600">Live</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Social proof strip */}
            <p className="mt-5 text-center text-xs text-ink-3">
              Trusted by professionals at Fortune 500 IT teams, global consulting firms, and leading tech organizations.
            </p>
          </div>
        </div>
      </Container>
    </section>
  )
}
