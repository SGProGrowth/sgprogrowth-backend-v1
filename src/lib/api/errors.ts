export class ApiError extends Error {
  status: number
  details?: unknown

  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error && error.message) return error.message
  return fallback
}

const NETWORK_HINT = 'Unable to reach the server. Check your connection and try again.'

export function getFriendlyErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return 'Your session has expired. Please sign in again.'
    }
    if (error.status === 403) {
      return error.message || 'You do not have permission to perform this action.'
    }
    if (error.status === 404) {
      return error.message || 'We could not find what you were looking for.'
    }
    if (error.status === 429) {
      return 'Too many requests. Please wait a moment and try again.'
    }
    if (error.status >= 500) {
      return 'Our servers are having trouble right now. Please try again in a few minutes.'
    }
    return error.message || fallback
  }

  if (error instanceof TypeError && /fetch|network|load failed/i.test(error.message)) {
    return NETWORK_HINT
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

export function fieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError) || !Array.isArray(error.details)) return {}
  const map: Record<string, string> = {}
  for (const item of error.details as Array<{ property?: string; constraints?: Record<string, string> }>) {
    if (item.property && item.constraints) {
      map[item.property] = Object.values(item.constraints)[0] ?? 'Invalid value'
    }
  }
  return map
}
