import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { navItems } from '../../data/homepageData'
import { useAuth } from '../../contexts/AuthContext'
import { getDashboardBasePath } from '../../data/dashboardData'
import { Container } from './Container'
import { NavDropdown } from './NavDropdown'
import { Button } from '../ui/Button'
import { SearchBar } from '../ui/SearchBar'
import { resolveMarketingHref } from '../../lib/navigation'
import { BrandLogo } from '../brand/BrandLogo'

export function Navbar() {
  const { isAuthenticated, user } = useAuth()
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
  const dashboardPath = user ? getDashboardBasePath(user.role) : '/dashboard'

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
          <BrandLogo variant="navbar" onClick={close} />

          <div className="hidden lg:flex items-center gap-0.5 ml-4">
            {navItems.map((item) => (
              <NavDropdown key={item.label} item={item} onNavigate={close} />
            ))}
          </div>

          <div className="hidden flex-1 max-w-md lg:block ml-auto mr-4">
            <SearchBar size="md" placeholder="Search courses, certifications..." />
          </div>

          <div className="ml-auto lg:ml-0 flex items-center gap-1.5 sm:gap-2">
            {isAuthenticated ? (
              <>
                <Button to={dashboardPath} variant="ghost" size="md" className="hidden sm:inline-flex">
                  Dashboard
                </Button>
                <Button to={dashboardPath} variant="primary" size="md" className="!px-3 sm:!px-5">
                  <span className="sm:hidden">Dashboard</span>
                  <span className="hidden sm:inline">Continue learning</span>
                </Button>
              </>
            ) : (
              <>
                <Button to="/login" variant="ghost" size="md" className="hidden sm:inline-flex">
                  Login
                </Button>
                <Button to="/register" variant="primary" size="md" className="!px-3 sm:!px-5">
                  Get started
                </Button>
              </>
            )}
            <button
              type="button"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-ink-2 hover:bg-stone-100 lg:hidden"
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMobileOpen((o) => !o)}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
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
                    <Link
                      to={resolveMarketingHref(item.href)}
                      className="flex min-h-11 items-center text-[15px] font-semibold text-ink"
                      onClick={close}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <>
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-4 mb-2">{item.label}</p>
                      {item.children?.map((child) => (
                        <Link
                          key={child.label}
                          to={resolveMarketingHref(child.href)}
                          className="flex min-h-11 items-center text-sm text-ink-2 hover:text-forest-800 transition-colors"
                          onClick={close}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </>
                  )}
                </div>
              ))}
              <div className="mt-6 space-y-2">
                {isAuthenticated ? (
                  <Button to={dashboardPath} variant="primary" size="md" className="w-full" onClick={close}>
                    Go to dashboard
                  </Button>
                ) : (
                  <>
                    <Button to="/login" variant="outline" size="md" className="w-full">Login</Button>
                    <Button to="/register" variant="primary" size="md" className="w-full">Get started</Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </Container>
    </header>
  )
}
