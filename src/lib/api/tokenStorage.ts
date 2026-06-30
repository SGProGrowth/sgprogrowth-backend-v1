const ACCESS_KEY = 'sgpg-access-token'
const REFRESH_KEY = 'sgpg-refresh-token'
const USER_KEY = 'sgpg-auth-user'

export interface StoredAuthUser {
  id: string
  name: string
  email: string
  role: 'student' | 'instructor'
  avatarInitials: string
  emailVerified: boolean
  organizationId?: string
}

export function getAccessToken(): string | null {
  return sessionStorage.getItem(ACCESS_KEY)
}

export function setAccessToken(token: string | null): void {
  if (token) sessionStorage.setItem(ACCESS_KEY, token)
  else sessionStorage.removeItem(ACCESS_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY)
}

export function setRefreshToken(token: string | null): void {
  if (token) localStorage.setItem(REFRESH_KEY, token)
  else localStorage.removeItem(REFRESH_KEY)
}

export function getStoredUser(): StoredAuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as StoredAuthUser) : null
  } catch {
    return null
  }
}

export function setStoredUser(user: StoredAuthUser | null): void {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
  else localStorage.removeItem(USER_KEY)
}

export function clearAuthStorage(): void {
  setAccessToken(null)
  setRefreshToken(null)
  setStoredUser(null)
}

export function persistAuthSession(input: {
  accessToken: string
  refreshToken: string
  user: StoredAuthUser
}): void {
  setAccessToken(input.accessToken)
  setRefreshToken(input.refreshToken)
  setStoredUser(input.user)
}
