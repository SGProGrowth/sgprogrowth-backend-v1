interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  className?: string
}

export function Pagination({ page, pageSize, total, onPageChange, className = '' }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (totalPages <= 1) return null

  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <p className="text-sm text-ink-3">
        Showing <span className="font-semibold text-ink-2">{start}–{end}</span> of{' '}
        <span className="font-semibold text-ink-2">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-ink-2 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
        >
          Previous
        </button>
        <span className="px-2 text-sm text-ink-3">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-ink-2 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  )
}

export function usePagination<T>(items: T[], pageSize: number, page: number) {
  const start = (page - 1) * pageSize
  return items.slice(start, start + pageSize)
}
