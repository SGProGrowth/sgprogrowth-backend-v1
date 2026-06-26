interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'brand' | 'accent' | 'dark'
  className?: string
}

const variants = {
  default: 'bg-stone-100 text-ink-2',
  brand: 'bg-forest-100 text-forest-800',
  accent: 'bg-gold-100 text-gold-700',
  dark: 'bg-forest-900 text-white',
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
