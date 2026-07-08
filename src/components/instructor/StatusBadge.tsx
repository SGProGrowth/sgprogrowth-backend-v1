type BadgeVariant = 'draft' | 'published' | 'archived' | 'pending' | 'graded' | 'active' | 'at-risk' | 'completed' | 'scheduled' | 'sent' | 'private'

const styles: Record<BadgeVariant, string> = {
  draft: 'bg-stone-100 text-ink-3',
  published: 'bg-forest-50 text-forest-800',
  archived: 'bg-stone-200 text-ink-2',
  pending: 'bg-gold-50 text-gold-700',
  graded: 'bg-forest-50 text-forest-800',
  active: 'bg-forest-50 text-forest-800',
  'at-risk': 'bg-red-50 text-red-700',
  completed: 'bg-forest-50 text-forest-800',
  scheduled: 'bg-gold-50 text-gold-700',
  sent: 'bg-forest-50 text-forest-800',
  private: 'bg-stone-200 text-ink-2',
}

export function StatusBadge({ status }: { status: BadgeVariant | string }) {
  const style = styles[status as BadgeVariant] ?? 'bg-stone-100 text-ink-3'
  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${style}`}>
      {status.replace('-', ' ')}
    </span>
  )
}

const lessonTypeIcons: Record<string, string> = {
  video: '🎬',
  pdf: '📄',
  resource: '📎',
  live: '🔴',
  quiz: '❓',
  assignment: '📝',
}

export function LessonTypeBadge({ type }: { type: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-ink-3 capitalize">
      <span aria-hidden="true">{lessonTypeIcons[type] ?? '📌'}</span>
      {type}
    </span>
  )
}
