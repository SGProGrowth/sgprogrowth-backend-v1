import type { UserRole } from '../../contexts/AuthContext'
import { apiRequest } from './client'
import { clearAuthStorage, persistAuthSession, type StoredAuthUser } from './tokenStorage'

export interface AuthTokensResponse {
  accessToken: string
  refreshToken: string
  user: StoredAuthUser & { roles?: string[]; organizationId: string }
}

export interface RegisterResponse {
  message: string
  email: string
  role: UserRole
  requiresVerification: boolean
}

export interface MessageResponse {
  message: string
  email?: string
}

export function registerAccount(input: {
  name: string
  email: string
  password: string
  role: UserRole
}): Promise<RegisterResponse> {
  return apiRequest('/auth/register', { method: 'POST', body: input })
}

export function loginAccount(input: {
  email: string
  password: string
  role: UserRole
}): Promise<AuthTokensResponse> {
  return apiRequest('/auth/login', { method: 'POST', body: input })
}

export function logoutAccount(): Promise<MessageResponse> {
  const refreshToken = localStorage.getItem('sgpg-refresh-token')
  if (!refreshToken) {
    clearAuthStorage()
    return Promise.resolve({ message: 'Signed out' })
  }
  return apiRequest<MessageResponse>('/auth/logout', { method: 'POST', body: { refreshToken } }).finally(() => {
    clearAuthStorage()
  })
}

export function verifyEmailToken(token: string): Promise<MessageResponse> {
  return apiRequest(`/auth/verify-email?token=${encodeURIComponent(token)}`)
}

export function resendVerificationEmail(email: string): Promise<MessageResponse> {
  return apiRequest('/auth/resend-verification', { method: 'POST', body: { email } })
}

export function requestPasswordReset(email: string): Promise<MessageResponse> {
  return apiRequest('/auth/forgot-password', { method: 'POST', body: { email } })
}

export function resetPassword(input: { token: string; password: string }): Promise<MessageResponse> {
  return apiRequest('/auth/reset-password', { method: 'POST', body: input })
}

/** Dev/E2E helper — retrieve last verification or reset token when E2E_TEST_MODE is enabled */
export function fetchDevAuthToken(
  email: string,
  type: 'verify' | 'reset',
): Promise<{ token: string }> {
  if (!import.meta.env.DEV) {
    return Promise.reject(new Error('Not available'))
  }
  return apiRequest(`/auth/test/token?email=${encodeURIComponent(email)}&type=${type}`)
}

export function saveLoginSession(response: AuthTokensResponse): StoredAuthUser {
  const user: StoredAuthUser = {
    id: response.user.id,
    name: response.user.name,
    email: response.user.email,
    role: response.user.role,
    avatarInitials: response.user.avatarInitials,
    emailVerified: response.user.emailVerified,
    organizationId: response.user.organizationId,
  }
  persistAuthSession({
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    user,
  })
  return user
}

export async function restoreSession(): Promise<StoredAuthUser | null> {
  const refreshToken = localStorage.getItem('sgpg-refresh-token')
  const stored = localStorage.getItem('sgpg-auth-user')
  if (!refreshToken || !stored) return null

  try {
    const response = await apiRequest<AuthTokensResponse>('/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
    })
    return saveLoginSession(response)
  } catch {
    clearAuthStorage()
    return null
  }
}
