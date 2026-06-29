import { Link } from 'react-router-dom'
import { footerLinks } from '../../data/homepageData'
import { resolveMarketingHref } from '../../lib/navigation'
import { Container } from './Container'

export function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-stone-50">
      <Container className="py-14 md:py-16">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-forest-800">
                <span className="text-xs font-bold text-white">SG</span>
              </div>
              <span className="font-display text-[15px] font-bold text-ink">SG Pro Growth</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-ink-3 leading-relaxed">
              Coaching before you learn. Personalised career guidance and enterprise programs for measurable outcomes.
            </p>
            <div className="mt-6 space-y-2 text-sm">
              <p><span className="text-ink-4">Email </span><a href="mailto:contact@sgprogrowth.com" className="text-ink font-medium hover:text-forest-800 transition-colors">contact@sgprogrowth.com</a></p>
              <p><span className="text-ink-4">WhatsApp </span><a href="https://wa.me/919152315130" className="text-ink font-medium hover:text-forest-800 transition-colors">+91 91523 15130</a></p>
              <p className="text-xs text-ink-3 leading-relaxed pt-1">606 F wing, Hubtown Greenwoods, Vartak Nagar, Thane, MH 400606</p>
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
                  {links.map((l) => {
                    const href = resolveMarketingHref(l.href)
                    const isRoute = href.startsWith('/') && !href.startsWith('//')
                    return (
                      <li key={l.label}>
                        {isRoute ? (
                          <Link to={href} className="text-sm text-ink-2 hover:text-ink transition-colors">{l.label}</Link>
                        ) : (
                          <a href={href} className="text-sm text-ink-2 hover:text-ink transition-colors">{l.label}</a>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-ink-4">© 2026 SG Pro Growth. All rights reserved.</p>
          <a href="/#top" className="text-xs font-semibold text-forest-800 hover:text-forest-900 transition-colors">Back to top ↑</a>
        </div>
      </Container>
    </footer>
  )
}
