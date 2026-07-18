export const VISITOR_STORAGE_KEY = 'gelos:visitor-id'

export function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return ''

  const existing = window.localStorage.getItem(VISITOR_STORAGE_KEY)?.trim()
  if (existing) return existing

  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `v_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

  window.localStorage.setItem(VISITOR_STORAGE_KEY, id)
  return id
}
