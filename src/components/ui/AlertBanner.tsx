import type { ReactNode } from 'react'

type AlertVariant = 'error' | 'success' | 'warning' | 'info'

interface AlertBannerProps {
  variant?: AlertVariant
  title?: string
  children: ReactNode
  className?: string
  role?: 'alert' | 'status'
}

const variantStyles: Record<AlertVariant, string> = {
  error: 'border-red-200 bg-red-50 text-red-800',
  success: 'border-forest-200 bg-forest-50 text-forest-900',
  warning: 'border-gold-100 bg-gold-50 text-gold-700',
  info: 'border-stone-200 bg-stone-50 text-ink-2',
}

export function AlertBanner({
  variant = 'error',
  title,
  children,
  className = '',
  role,
}: AlertBannerProps) {
  const resolvedRole = role ?? (variant === 'error' || variant === 'warning' ? 'alert' : 'status')

  return (
    <div
      role={resolvedRole}
      className={`rounded-lg border px-4 py-3 text-sm ${variantStyles[variant]} ${className}`}
    >
      {title && <p className="mb-1 font-semibold">{title}</p>}
      <div className={title ? 'text-[13px] leading-relaxed opacity-90' : ''}>{children}</div>
    </div>
  )
}
