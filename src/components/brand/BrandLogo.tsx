import { Link } from 'react-router-dom'
import { branding } from '../../config/branding'

type BrandLogoVariant = 'navbar' | 'sidebar' | 'footer' | 'auth' | 'auth-light' | 'loading'

interface BrandLogoProps {
  variant?: BrandLogoVariant
  subtitle?: string
  to?: string
  className?: string
  onClick?: () => void
}

const logoHeights: Record<BrandLogoVariant, string> = {
  navbar: 'h-9',
  sidebar: 'h-9',
  footer: 'h-8',
  auth: 'h-10',
  'auth-light': 'h-10',
  loading: 'h-10',
}

const nameSizes: Record<BrandLogoVariant, string> = {
  navbar: 'text-[15px]',
  sidebar: 'text-[14px]',
  footer: 'text-[15px]',
  auth: 'text-base',
  'auth-light': 'text-base',
  loading: 'text-sm',
}

function LogoImage({ variant }: { variant: BrandLogoVariant }) {
  return (
    <img
      src={branding.logoSrc}
      alt={branding.logoAlt}
      className={`${logoHeights[variant]} w-auto max-w-[160px] object-contain object-left`}
    />
  )
}

function LogoContent({ variant, subtitle }: { variant: BrandLogoVariant; subtitle?: string }) {
  const isLight = variant === 'auth' || variant === 'auth-light'
  const resolvedSubtitle =
    subtitle ?? (variant === 'navbar' || variant === 'sidebar' || variant === 'auth' ? branding.productSubtitle : undefined)
  const showSubtitle = variant !== 'footer' && variant !== 'loading' && Boolean(resolvedSubtitle)

  return (
    <>
      <LogoImage variant={variant} />
      {(variant === 'navbar' || variant === 'sidebar' || variant === 'auth' || variant === 'auth-light') && (
        <div className={`hidden leading-none sm:block ${variant === 'auth' || variant === 'auth-light' ? 'lg:block' : ''}`}>
          <span
            className={`block font-display font-bold ${nameSizes[variant]} ${isLight ? 'text-white' : 'text-ink'}`}
          >
            {branding.name}
          </span>
          {showSubtitle && resolvedSubtitle && (
            <span
              className={`mt-0.5 block text-[10px] font-medium uppercase tracking-wide ${
                isLight ? 'text-white/60' : 'text-ink-3'
              } ${variant === 'sidebar' ? 'capitalize' : ''}`}
            >
              {resolvedSubtitle}
            </span>
          )}
        </div>
      )}
      {variant === 'footer' && (
        <span className={`font-display font-bold ${nameSizes[variant]} text-ink`}>{branding.name}</span>
      )}
    </>
  )
}

export function BrandLogo({ variant = 'navbar', subtitle, to = '/', className = '', onClick }: BrandLogoProps) {
  const content = <LogoContent variant={variant} subtitle={subtitle} />

  const baseClass = `inline-flex min-w-0 items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600 focus-visible:ring-offset-2 ${
    variant === 'auth' || variant === 'auth-light' ? 'focus-visible:ring-offset-forest-900' : ''
  } ${className}`

  if (variant === 'loading') {
    return (
      <div className={`flex flex-col items-center gap-3 ${className}`}>
        <LogoImage variant={variant} />
      </div>
    )
  }

  if (to) {
    return (
      <Link to={to} className={baseClass} onClick={onClick}>
        {content}
      </Link>
    )
  }

  return <div className={baseClass}>{content}</div>
}
