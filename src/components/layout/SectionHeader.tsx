interface SectionHeaderProps {
  eyebrow?: string
  title: string
  description?: string
  align?: 'left' | 'center'
  className?: string
  action?: React.ReactNode
  dark?: boolean
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = 'left',
  className = '',
  action,
  dark = false,
}: SectionHeaderProps) {
  const alignment = align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-xl text-left'

  return (
    <div
      className={`mb-10 flex flex-col gap-5 md:mb-12 md:flex-row md:items-end md:justify-between ${className}`}
    >
      <div className={alignment}>
        {eyebrow && (
          <p className={`text-label mb-3 ${dark ? 'text-forest-200' : ''}`}>{eyebrow}</p>
        )}
        <h2 className={`text-display-lg ${dark ? 'text-white' : 'text-ink'}`}>{title}</h2>
        {description && (
          <p className={`text-body-lg mt-3 ${dark ? 'text-stone-300' : ''} ${align === 'center' ? 'mx-auto' : ''}`}>
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
