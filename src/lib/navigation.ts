/** Resolve marketing hash links so they work from any route (e.g. /courses → /#courses). */
export function resolveMarketingHref(href: string): string {
  if (!href) return href
  if (href.startsWith('http') || href.startsWith('mailto:')) return href
  if (href.startsWith('/')) return href
  if (href.startsWith('#')) return `/${href}`
  return href
}

export function isExternalHref(href: string): boolean {
  return href.startsWith('http') || href.startsWith('mailto:')
}
