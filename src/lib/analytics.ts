export function trackEvent(name: string, payload: Record<string, any> = {}) {
  // Basic analytics shim: console + window.dataLayer if present.
  try {
    console.info('Analytics event:', name, payload)
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      ;(window as any).dataLayer.push({ event: name, ...payload })
    }
    // store a lightweight log in localStorage for quick inspection (non-sensitive)
    if (typeof window !== 'undefined' && window.localStorage) {
      const key = 'analytics_events'
      const existing = JSON.parse(window.localStorage.getItem(key) || '[]')
      existing.push({ name, payload, ts: Date.now() })
      window.localStorage.setItem(key, JSON.stringify(existing.slice(-200)))
    }
  } catch (e) {
    // swallow errors to avoid breaking UX
    console.warn('trackEvent failed', e)
  }
}
