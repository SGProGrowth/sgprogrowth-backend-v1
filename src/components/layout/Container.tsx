import type { ReactNode } from 'react'

interface ContainerProps {
  children: ReactNode
  className?: string
  as?: 'div' | 'section' | 'nav' | 'footer' | 'header'
  id?: string
}

export function Container({
  children,
  className = '',
  as: Component = 'div',
  id,
}: ContainerProps) {
  return (
    <Component
      id={id}
      className={`mx-auto w-full max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 ${className}`}
    >
      {children}
    </Component>
  )
}
