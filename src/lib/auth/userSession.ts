import type { UserRole } from '../../contexts/AuthContext'

const USER_ID_PREFIX = 'sgpg-user-id'
const REGISTRATION_PREFIX = 'sgpg-registration'

export interface StoredRegistration {
  name: string
  email: string
  role: UserRole
}

export function saveRegistration(name: string, email: string, role: UserRole): void {
  const key = `${REGISTRATION_PREFIX}:${role}:${normalizeEmail(email)}`
  try {
    localStorage.setItem(key, JSON.stringify({ name: name.trim(), email: email.trim(), role }))
  } catch {
    // ignore storage errors in mock auth
  }
}

export function getRegistration(email: string, role: UserRole): StoredRegistration | null {
  const key = `${REGISTRATION_PREFIX}:${role}:${normalizeEmail(email)}`
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as StoredRegistration) : null
  } catch {
    return null
  }
}

export function clearRegistration(email: string, role: UserRole): void {
  const key = `${REGISTRATION_PREFIX}:${role}:${normalizeEmail(email)}`
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function displayNameFromEmail(email: string, fallback: string): string {
  const local = normalizeEmail(email).split('@')[0] ?? ''
  const name = local.replace(/[._+-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).trim()
  return name || fallback
}

export function initialsFromName(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

/** Stable id per email+role — replace with API user id after backend auth */
export function getOrCreateUserId(email: string, role: UserRole): string {
  const key = `${USER_ID_PREFIX}:${role}:${normalizeEmail(email)}`
  try {
    const stored = localStorage.getItem(key)
    if (stored) return stored
    const id = crypto.randomUUID()
    localStorage.setItem(key, id)
    return id
  } catch {
    return crypto.randomUUID()
  }
}
