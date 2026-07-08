/**
 * SG Pro Growth branding — sourced from https://sgprogrowth.com
 * Keep in sync with src/config/branding.ts on the frontend.
 */
export const BRAND = {
  name: 'SG Pro Growth',
  tagline: 'Coaching before you learn, clarity before you certify.',
  websiteUrl: 'https://sgprogrowth.com',
  contactEmail: 'contact@sgprogrowth.com',
  contactPhone: '+91 91523 15130',
  /** Relative path served by the LMS frontend (public/brand/logo.jpeg) */
  logoPath: '/brand/logo.jpeg',
  primaryColor: '#062D6F',
  accentColor: '#0D4DB8',
  certificateDefaults: {
    primaryColor: '#062D6F',
    accentColor: '#0D4DB8',
    borderStyle: 'double',
  },
} as const

export function resolveBrandLogoUrl(appUrl: string, explicitLogoUrl?: string | null): string | null {
  if (explicitLogoUrl?.trim()) return explicitLogoUrl.trim()
  const base = appUrl.replace(/\/$/, '')
  if (!base) return null
  return `${base}${BRAND.logoPath}`
}
