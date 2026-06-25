interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'brand' | 'accent' | 'dark'
  className?: string
}

const variants = {
  default: 'bg-slate-100 text-slate-700',
  brand: 'bg-brand-50 text-brand-700',
  accent: 'bg-accent-50 text-accent-600',
  dark: 'bg-navy-900 text-white',
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
