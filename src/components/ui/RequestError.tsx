import { AlertBanner } from './AlertBanner'
import { Button } from './Button'

interface RequestErrorProps {
  title?: string
  message: string
  onRetry?: () => void
  retryLabel?: string
  className?: string
}

export function RequestError({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try again',
  className = '',
}: RequestErrorProps) {
  return (
    <div
      className={`rounded-xl border border-red-200 bg-white px-6 py-8 text-center shadow-[0_1px_2px_rgba(10,10,10,0.04)] ${className}`}
      role="alert"
    >
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
        <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <p className="font-display text-base font-bold text-ink">{title}</p>
      <AlertBanner variant="error" className="mt-4 text-left">
        {message}
      </AlertBanner>
      {onRetry && (
        <Button type="button" variant="primary" size="md" className="mt-5" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  )
}
