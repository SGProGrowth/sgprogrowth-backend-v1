import { Link } from 'react-router-dom'
import { footerLinks } from '../../data/homepageData'
import { resolveMarketingHref } from '../../lib/navigation'
import { Container } from './Container'
import { BrandLogo } from '../brand/BrandLogo'
import { branding } from '../../config/branding'

export function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-stone-50">
      <Container className="py-14 md:py-16">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <BrandLogo variant="footer" />
            <p className="mt-4 max-w-xs text-sm text-ink-3 leading-relaxed">
              {branding.description}
            </p>
            <div className="mt-6 space-y-2 text-sm">
              <p><span className="text-ink-4">Email </span><a href={`mailto:${branding.contactEmail}`} className="text-ink font-medium hover:text-forest-800 transition-colors">{branding.contactEmail}</a></p>
              <p><span className="text-ink-4">WhatsApp </span><a href={branding.whatsappUrl} className="text-ink font-medium hover:text-forest-800 transition-colors">{branding.contactPhone}</a></p>
              <p className="text-xs text-ink-3 leading-relaxed pt-1">{branding.addressShort}</p>
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
          <p className="text-xs text-ink-4">{branding.copyright}</p>
          <a href="/#top" className="text-xs font-semibold text-forest-800 hover:text-forest-900 transition-colors">Back to top ↑</a>
        </div>
      </Container>
    </footer>
  )
}
