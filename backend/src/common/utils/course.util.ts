export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)
}

export async function uniqueCourseSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const root = slugify(base) || 'course'
  let candidate = root
  let suffix = 2

  while (await exists(candidate)) {
    candidate = `${root}-${suffix}`
    suffix += 1
  }

  return candidate
}

export function formatPrice(priceCents: number, currency = 'INR'): string {
  if (priceCents <= 0) return 'Free'
  const amount = priceCents / 100
  if (currency === 'INR') return `₹${amount.toLocaleString('en-IN')}`
  return `${currency} ${amount.toLocaleString()}`
}

export function formatDuration(durationHours?: number | null): string {
  if (!durationHours) return 'Self-paced'
  return `${durationHours} weeks`
}

export function formatDateLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatLearnerCount(count: number): string | undefined {
  if (count <= 0) return undefined
  if (count >= 1000) return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}k+`
  return String(count)
}
