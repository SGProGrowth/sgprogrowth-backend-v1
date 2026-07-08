/**
 * SG Pro Growth branding — sourced from https://sgprogrowth.com
 *
 * To swap the logo when the HD asset arrives, replace `public/brand/logo.jpeg`
 * (keep the same filename) or update `logoSrc` below.
 */
export const branding = {
  /** Official company name as shown on sgprogrowth.com */
  name: 'SG Pro Growth',
  /** Alternate spelling used in body copy on the website */
  nameAlt: 'SGProGrowth',
  /** Browser / meta title suffix */
  title: 'SG Pro Growth — Training minds. Transforming businesses.',
  /** Primary hero tagline */
  tagline: 'Coaching before you learn, clarity before you certify.',
  /** Company description from the website */
  description:
    'SGProGrowth gives you personally synergised career guidance before you enrol in any training—so you learn with purpose and grow with confidence.',
  /** LMS product subtitle (not on marketing site; describes this app) */
  productSubtitle: 'Learning Platform',

  /** Single logo path — update only here (or replace the file at this path) */
  logoSrc: '/brand/logo.jpeg',
  logoAlt: 'SG Pro Growth',
  faviconSrc: '/brand/favicon-32x32.jpeg',
  appleTouchIconSrc: '/brand/apple-touch-icon.jpeg',

  websiteUrl: 'https://sgprogrowth.com',
  contactEmail: 'contact@sgprogrowth.com',
  contactPhone: '+91 91523 15130',
  contactPhoneTel: '+919152315130',
  whatsappUrl: 'https://wa.me/919152315130',
  address: '606 F wing, Hubtown Greenwoods, Vartak Nagar, Thane, MH, India 400606',
  addressShort: '606 F wing, Hubtown Greenwoods, Vartak Nagar, Thane, MH 400606',
  copyright: '© sharvagroup. All rights reserved.',

  legal: {
    privacy: 'https://sgprogrowth.com/privacy-policy/',
    terms: 'https://sgprogrowth.com/terms-of-service/',
    refund: 'https://sgprogrowth.com/refund_returns/',
  },

  colors: {
    primary: '#062D6F',
    accent: '#0D4DB8',
    text: '#54595F',
    muted: '#7A7A7A',
    light: '#6EC1E4',
    success: '#61CE70',
    surface: '#F2F1F1',
    dark: '#080707',
  },

  fonts: {
    body: 'Muli',
    display: 'Montserrat',
  },

  /** No active social profile URLs were found on sgprogrowth.com */
  social: {} as Record<string, string>,
} as const

export type Branding = typeof branding
