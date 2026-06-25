import { useEffect, useState } from 'react'
import { navItems } from '../../data/homepageData'
import { Container } from './Container'
import { NavDropdown } from './NavDropdown'
import { Button } from '../ui/Button'
import { SearchBar } from '../ui/SearchBar'

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll)
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const close = () => setMobileOpen(false)

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-shadow duration-200 ${
        scrolled
          ? 'border-stone-200 bg-white shadow-[0_1px_3px_rgba(10,10,10,0.06)]'
          : 'border-transparent bg-stone-50'
      }`}
    >
      <Container as="nav" aria-label="Main navigation">
        <div className="flex h-16 items-center gap-6">
          {/* Logo */}
          <a href="#top" className="flex shrink-0 items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600 focus-visible:ring-offset-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-forest-800">
              <span className="text-sm font-bold text-white tracking-tight">SG</span>
            </div>
            <div className="hidden sm:block leading-none">
              <span className="block font-display text-[15px] font-bold text-ink">SG Pro Growth</span>
              <span className="block text-[10px] font-medium text-ink-3 mt-0.5 tracking-wide uppercase">Learning Platform</span>
            </div>
          </a>

          {/* Nav links */}
          <div className="hidden lg:flex items-center gap-0.5 ml-4">
            {navItems.map((item) => (
              <NavDropdown key={item.label} item={item} onNavigate={close} />
            ))}
          </div>

          {/* Search */}
          <div className="hidden flex-1 max-w-md lg:block ml-auto mr-4">
            <SearchBar size="md" placeholder="Search courses, certifications..." />
          </div>

          {/* Actions */}
          <div className="ml-auto lg:ml-0 flex items-center gap-2">
            <Button href="#signup" variant="ghost" size="md" className="hidden sm:inline-flex">
              Log in
            </Button>
            <Button href="#signup" variant="primary" size="md">
              Get started
            </Button>
            <button
              type="button"
              className="inline-flex rounded-md p-2 text-ink-2 hover:bg-stone-100 lg:hidden"
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMobileOpen((o) => !o)}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {mobileOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="fixed inset-0 top-16 z-40 overflow-y-auto bg-white lg:hidden">
            <div className="border-b border-stone-200 p-4">
              <SearchBar size="md" placeholder="Search courses..." />
            </div>
            <div className="p-4">
              {navItems.map((item) => (
                <div key={item.label} className="border-b border-stone-100 py-4 last:border-0">
                  {item.href && !item.children ? (
                    <a href={item.href} className="text-[15px] font-semibold text-ink" onClick={close}>{item.label}</a>
                  ) : (
                    <>
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-4 mb-2">{item.label}</p>
                      {item.children?.map((child) => (
                        <a key={child.label} href={child.href} className="block py-2 text-sm text-ink-2 hover:text-forest-800" onClick={close}>
                          {child.label}
                        </a>
                      ))}
                    </>
                  )}
                </div>
              ))}
              <div className="mt-6 space-y-2">
                <Button href="#signup" variant="outline" size="md" className="w-full">Log in</Button>
                <Button href="#signup" variant="primary" size="md" className="w-full">Get started free</Button>
              </div>
            </div>
          </div>
        )}
      </Container>
    </header>
  )
}
