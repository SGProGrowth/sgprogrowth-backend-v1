import { ApiError } from './errors'
import {
  clearAuthStorage,
  getAccessToken,
  getRefreshToken,
  persistAuthSession,
  type StoredAuthUser,
} from './tokenStorage'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

interface RequestOptions {
  method?: HttpMethod
  body?: unknown
  auth?: boolean
  retry?: boolean
}

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null

  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })

  if (!res.ok) {
    clearAuthStorage()
    return null
  }

  const data = (await res.json()) as {
    accessToken: string
    refreshToken: string
    user: StoredAuthUser
  }

  persistAuthSession(data)
  return data.accessToken
}

async function getValidAccessToken(retry: boolean): Promise<string | null> {
  const existing = getAccessToken()
  if (existing) return existing

  if (!retry) return null

  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null
    })
  }

  return refreshPromise
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = false, retry = true } = options

  const headers: Record<string, string> = {
    Accept: 'application/json',
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  if (auth) {
    const token = await getValidAccessToken(retry)
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401 && auth && retry) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      return apiRequest<T>(path, { ...options, auth: true, retry: false })
    }
  }

  const payload = await res.json().catch(() => ({}))

  if (!res.ok) {
    const message =
      (payload as { message?: string | string[] }).message ??
      (payload as { error?: { message?: string } }).error?.message ??
      `Request failed (${res.status})`

    throw new ApiError(
      Array.isArray(message) ? message.join(', ') : String(message),
      res.status,
      (payload as { message?: unknown }).message,
    )
  }

  return payload as T
}

export function getApiBaseUrl(): string {
  return API_BASE
}
