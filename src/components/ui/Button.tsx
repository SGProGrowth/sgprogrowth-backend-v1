import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'gold'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  href?: string
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
  sm: 'px-3.5 py-2 text-sm rounded-md',
  md: 'px-5 py-2.5 text-sm rounded-md',
  lg: 'px-6 py-3 text-[15px] rounded-md',
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  href,
  className = '',
  ...props
}: ButtonProps) {
  const classes = `inline-flex items-center justify-center gap-2 font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`

  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    )
  }

  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  )
}
