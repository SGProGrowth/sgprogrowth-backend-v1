import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { isExternalHref, resolveMarketingHref } from '../../lib/navigation'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'gold'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  href?: string
  to?: string
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-forest-800 text-white hover:bg-forest-900 focus-visible:ring-forest-600',
  secondary:
    'border border-stone-300 bg-white text-ink hover:border-stone-400 hover:bg-stone-50 focus-visible:ring-stone-400',
  ghost:
    'text-ink-2 hover:bg-stone-100 hover:text-ink focus-visible:ring-stone-400',
  outline:
    'border border-stone-300 bg-transparent text-ink hover:border-forest-700 hover:text-forest-800 focus-visible:ring-forest-600',
  gold:
    'bg-gold-600 text-white hover:bg-gold-700 focus-visible:ring-gold-500',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3.5 py-2 min-h-9 text-sm rounded-md',
  md: 'px-5 py-2.5 min-h-11 text-sm rounded-md',
  lg: 'px-6 py-3 min-h-12 text-[15px] rounded-md',
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  href,
  to,
  className = '',
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  const classes = `inline-flex items-center justify-center gap-2 font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`

  if (to) {
    if (disabled) {
      return <span className={`${classes} pointer-events-none opacity-50`} aria-disabled="true">{children}</span>
    }
    return (
      <Link to={to} className={classes} aria-disabled={disabled || undefined}>
        {children}
      </Link>
    )
  }

  if (href) {
    const resolved = resolveMarketingHref(href)
    const external = isExternalHref(resolved)
    return (
      <a
        href={resolved}
        className={classes}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        aria-disabled={disabled || undefined}
      >
        {children}
      </a>
    )
  }

  return (
    <button type={type} className={classes} disabled={disabled} {...props}>
      {children}
    </button>
  )
}
