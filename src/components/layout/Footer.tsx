import { footerLinks } from '../../data/homepageData'
import { Container } from './Container'

export function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-stone-50">
      <Container className="py-14 md:py-16">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <a href="#top" className="inline-flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-forest-800">
                <span className="text-xs font-bold text-white">SG</span>
              </div>
              <span className="font-display text-[15px] font-bold text-ink">SG Pro Growth</span>
            </a>
            <p className="mt-4 max-w-xs text-sm text-ink-3 leading-relaxed">
              Coaching before you learn. Personalised career guidance and enterprise programs for measurable outcomes.
            </p>
            <div className="mt-6 space-y-1 text-sm">
              <p><span className="text-ink-4">Sales </span><a href="mailto:sales@sharvagroup.com" className="text-ink font-medium hover:text-forest-800">sales@sharvagroup.com</a></p>
              <p><span className="text-ink-4">Support </span><a href="mailto:support@sharvagroup.com" className="text-ink font-medium hover:text-forest-800">support@sharvagroup.com</a></p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-8">
            {([
              ['Courses', footerLinks.courses],
              ['Company', footerLinks.company],
              ['Legal', footerLinks.legal],
            ] as const).map(([title, links]) => (
              <div key={title}>
                <h3 className="text-[11px] font-semibold uppercase tracking-widest text-ink-4 mb-4">{title}</h3>
                <ul className="space-y-2.5">
                  {links.map((l) => (
                    <li key={l.label}>
                      <a href={l.href} className="text-sm text-ink-2 hover:text-ink transition-colors">{l.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-ink-4">© 2026 sharvagroup. All rights reserved.</p>
          <a href="#top" className="text-xs font-semibold text-forest-800 hover:text-forest-900">Back to top ↑</a>
        </div>
      </Container>
    </footer>
  )
}
