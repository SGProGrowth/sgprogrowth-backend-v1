export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function formatExpiryLabel(hours: number): string {
  if (hours < 1) {
    const minutes = Math.max(1, Math.round(hours * 60))
    return `${minutes} minute${minutes === 1 ? '' : 's'}`
  }
  if (hours === 1) return '1 hour'
  if (hours < 24) return `${hours} hours`
  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? '' : 's'}`
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}
