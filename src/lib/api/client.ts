import { ApiError } from './errors'
import {
  clearAuthStorage,
  getAccessToken,
  getRefreshToken,
  persistAuthSession,
  type StoredAuthUser,
} from './tokenStorage'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'

const FETCH_CREDENTIALS: RequestCredentials = 'include'

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

interface RequestOptions {
  method?: HttpMethod
  body?: unknown
  auth?: boolean
  retry?: boolean
  signal?: AbortSignal
}

let refreshPromise: Promise<string | null> | null = null

export function isRequestAborted(err: unknown): boolean {
  if (err instanceof DOMException && err.name === 'AbortError') return true
  if (err instanceof Error && err.name === 'AbortError') return true
  return false
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null

  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
    credentials: FETCH_CREDENTIALS,
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

function parseErrorMessage(payload: unknown, status: number): string {
  const message =
    (payload as { message?: string | string[] }).message ??
    (payload as { error?: { message?: string } }).error?.message ??
    `Request failed (${status})`

  return Array.isArray(message) ? message.join(', ') : String(message)
}

function networkError(err: unknown): never {
  if (isRequestAborted(err)) throw err
  throw new ApiError('Unable to reach the server. Check your connection and try again.', 0)
}

async function authorizedRequest(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<Response> {
  const token = await getValidAccessToken(true)
  if (!token) throw new ApiError('Authentication required', 401)

  const headers = new Headers(init.headers)
  if (!headers.has('Accept')) headers.set('Accept', 'application/json')
  headers.set('Authorization', `Bearer ${token}`)

  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers,
      credentials: FETCH_CREDENTIALS,
    })
  } catch (err) {
    networkError(err)
  }

  if (res.status === 401 && retry) {
    const newToken = await refreshAccessToken()
    if (newToken) return authorizedRequest(path, init, false)
    clearAuthStorage()
    throw new ApiError('Session expired', 401)
  }

  return res
}

export async function authorizedFetch<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await authorizedRequest(path, init)
  const payload = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new ApiError(parseErrorMessage(payload, res.status), res.status, payload)
  }

  return payload as T
}

export async function authorizedMultipart<T = unknown>(
  path: string,
  method: string,
  form: FormData,
): Promise<T> {
  const res = await authorizedRequest(path, { method, body: form })
  const payload = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new ApiError(parseErrorMessage(payload, res.status), res.status, payload)
  }

  return payload as T
}

export async function authorizedDownload(path: string, filename: string): Promise<void> {
  const res = await authorizedRequest(path)
  if (!res.ok) throw new ApiError('Download failed', res.status)

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = false, retry = true, signal } = options

  const headers: Record<string, string> = {
    Accept: 'application/json',
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  if (auth) {
    const token = await getValidAccessToken(retry)
    if (!token) throw new ApiError('Authentication required', 401)
    headers.Authorization = `Bearer ${token}`
  }

  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: FETCH_CREDENTIALS,
      signal,
    })
  } catch (err) {
    networkError(err)
  }

  if (res.status === 401 && auth && retry) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      return apiRequest<T>(path, { ...options, auth: true, retry: false })
    }
    clearAuthStorage()
    throw new ApiError('Session expired', 401)
  }

  const payload = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new ApiError(parseErrorMessage(payload, res.status), res.status, payload)
  }

  return payload as T
}

export function getApiBaseUrl(): string {
  return API_BASE
}

export async function getAuthBearerToken(): Promise<string> {
  const token = await getValidAccessToken(true)
  if (!token) throw new ApiError('Authentication required', 401)
  return token
}

export function isSafeRedirectPath(path: string | undefined): path is string {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return false
  if (path.startsWith('/login') || path.startsWith('/register')) return false
  return true
}
