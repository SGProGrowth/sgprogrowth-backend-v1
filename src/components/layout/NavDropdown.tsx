import { useEffect, useRef, useState } from 'react'
import type { NavItem } from '../../data/homepageData'

interface NavDropdownProps {
  item: NavItem
  onNavigate?: () => void
}

export function NavDropdown({ item, onNavigate }: NavDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!item.children?.length) {
    return (
      <a
        href={item.href}
        className="px-3 py-2 text-sm font-medium text-ink-2 rounded-md hover:text-ink hover:bg-stone-100 transition-colors"
        onClick={onNavigate}
      >
        {item.label}
      </a>
    )
  }

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-ink-2 rounded-md hover:text-ink hover:bg-stone-100 transition-colors"
      >
        {item.label}
        <svg className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-lg border border-stone-200 bg-white py-1 shadow-[0_8px_30px_rgba(10,10,10,0.1)]">
          {item.children.map((child) => (
            <a
              key={child.label}
              href={child.href}
              className="block px-4 py-3 hover:bg-stone-50 transition-colors"
              onClick={() => { setOpen(false); onNavigate?.() }}
            >
              <span className="block text-sm font-medium text-ink">{child.label}</span>
              {child.description && (
                <span className="block text-xs text-ink-3 mt-0.5">{child.description}</span>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
