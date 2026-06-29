const cache = new Map<string, unknown>()

export function getCachedWorkspace<T>(key: string): T | undefined {
  return cache.get(key) as T | undefined
}

export function setCachedWorkspace<T>(key: string, workspace: T): T {
  cache.set(key, workspace)
  return workspace
}

export function workspaceCacheKey(role: string, userId: string): string {
  return `${role}:${userId}`
}

export function clearWorkspaceCache(): void {
  cache.clear()
}
