import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BrandLogo } from '../components/brand/BrandLogo'
import { branding } from '../config/branding'

interface AuthLayoutProps {
  children: ReactNode
  title: string
  subtitle: string
  backHref?: string
  backLabel?: string
}

export function AuthLayout({
  children,
  title,
  subtitle,
  backHref = '/',
  backLabel = 'Back to homepage',
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Brand panel */}
        <div className="relative hidden overflow-hidden bg-forest-900 lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 opacity-[0.07]">
            <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white" />
            <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-white" />
          </div>

          <div className="relative p-10 xl:p-14">
            <BrandLogo variant="auth" className="rounded-md" />

            <div className="mt-16 max-w-md">
              <p className="text-label text-forest-200 mb-4">Coaching-led learning</p>
              <h2 className="font-display text-3xl font-bold leading-tight tracking-tight text-white xl:text-4xl">
                {branding.tagline}
              </h2>
              <p className="mt-5 text-base leading-relaxed text-white/70">
                {branding.description}
              </p>
            </div>
          </div>

          <div className="relative border-t border-white/10 p-10 xl:p-14">
            <blockquote className="text-white/80">
              <p className="text-sm leading-relaxed italic">
                &ldquo;The mentoring kept me motivated and focused. I finally completed a course and applied
                the skills in real projects.&rdquo;
              </p>
              <footer className="mt-3 text-xs font-semibold text-white/50">
                — Riya, Data Analyst
              </footer>
            </blockquote>
          </div>
        </div>

        {/* Form panel */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between px-6 py-5 lg:px-10">
            <BrandLogo variant="navbar" className="lg:hidden" />
            <Link to={backHref} className="text-sm font-semibold text-forest-800 transition-colors hover:text-forest-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600 focus-visible:ring-offset-2 rounded-md ml-auto">
              {backLabel}
            </Link>
          </div>

          <div className="flex flex-1 items-center justify-center px-4 pb-10 sm:px-6 sm:pb-12 lg:px-10">
            <div className="w-full max-w-md animate-rise">
              <div className="mb-8">
                <h1 className="text-display-md text-ink">{title}</h1>
                <p className="mt-2 text-body-lg">{subtitle}</p>
              </div>
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
