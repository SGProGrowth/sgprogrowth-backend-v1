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
