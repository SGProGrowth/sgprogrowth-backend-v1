import type { ReactNode } from 'react'

interface SplitInboxProps {
  list: ReactNode
  detail: ReactNode
  /** On mobile, show detail pane instead of list */
  mobileShowDetail: boolean
  onMobileBack: () => void
  backLabel?: string
  emptyDetail?: ReactNode
}

export function SplitInbox({
  list,
  detail,
  mobileShowDetail,
  onMobileBack,
  backLabel = 'Back to inbox',
  emptyDetail,
}: SplitInboxProps) {
  return (
    <>
      {/* Mobile: master-detail */}
      <div className="lg:hidden min-h-[360px]">
        {mobileShowDetail ? (
          <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
            <div className="border-b border-stone-100 px-3 py-2">
              <button
                type="button"
                onClick={onMobileBack}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-sm font-semibold text-forest-800 hover:bg-stone-50"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                {backLabel}
              </button>
            </div>
            {detail}
          </div>
        ) : (
          <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">{list}</div>
        )}
      </div>

      {/* Desktop: side-by-side */}
      <div className="hidden lg:grid lg:grid-cols-5 gap-0 min-h-[480px] rounded-xl border border-stone-200 bg-white overflow-hidden">
        <div className="lg:col-span-2 border-r border-stone-200 overflow-hidden">{list}</div>
        <div className="lg:col-span-3">
          {detail ?? emptyDetail ?? (
            <div className="flex h-full min-h-[480px] items-center justify-center p-8">
              <p className="text-sm text-ink-3">Select a message to read</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
