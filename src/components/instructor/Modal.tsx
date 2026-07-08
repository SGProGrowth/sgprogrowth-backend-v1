import { useEffect, useId, useRef, type ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  footer?: ReactNode
}

const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

export function Modal({ open, onClose, title, description, children, size = 'md', footer }: ModalProps) {
  const titleId = useId()
  const descId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    panelRef.current?.focus()
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4 safe-bottom">
      <button type="button" className="absolute inset-0 bg-ink/50 animate-rise" aria-label="Close dialog" onClick={onClose} />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className={`relative flex max-h-[92dvh] w-full flex-col ${sizes[size]} rounded-t-xl border border-stone-200 bg-white shadow-2xl animate-rise outline-none sm:max-h-[85dvh] sm:rounded-xl`}
      >
        <div className="shrink-0 border-b border-stone-100 px-4 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id={titleId} className="font-display text-lg font-bold text-ink">{title}</h2>
              {description && <p id={descId} className="mt-1 text-sm text-ink-3">{description}</p>}
            </div>
            <button type="button" onClick={onClose} className="icon-btn text-ink-3" aria-label="Close">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto scroll-touch px-4 py-4 sm:px-6 sm:py-5">{children}</div>
        {footer && (
          <div className="shrink-0 border-t border-stone-100 px-4 py-4 flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-end sm:gap-3 sm:px-6 safe-bottom">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  variant?: 'danger' | 'primary'
  loading?: boolean
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  variant = 'primary',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>Cancel</button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={variant === 'danger' ? 'inline-flex items-center rounded-md bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50' : 'btn-primary'}
          >
            {loading ? 'Processing…' : confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-ink-2">{message}</p>
    </Modal>
  )
}

export function SuccessBanner({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  return (
    <div className="mb-6 flex items-center gap-3 rounded-lg border border-forest-200 bg-forest-50 px-4 py-3 animate-rise" role="status">
      <svg className="h-5 w-5 shrink-0 text-forest-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p className="flex-1 text-sm font-medium text-forest-800">{message}</p>
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="text-forest-600 hover:text-forest-800" aria-label="Dismiss">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}
