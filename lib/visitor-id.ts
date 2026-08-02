export const VISITOR_STORAGE_KEY = 'gelos:visitor-id'
/** Cookie readable by www + checkout.gelosglobal.com for CAPI external_id. */
export const VISITOR_COOKIE_NAME = 'gelos_vid'

function syncVisitorIdCookie(id: string) {
  if (typeof document === 'undefined' || !id) return

  const maxAge = 60 * 60 * 24 * 400
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  const encoded = encodeURIComponent(id)
  const base = `${VISITOR_COOKIE_NAME}=${encoded}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`

  document.cookie = base

  const host = window.location.hostname
  if (host === 'gelosglobal.com' || host.endsWith('.gelosglobal.com')) {
    document.cookie = `${base}; Domain=.gelosglobal.com`
  }
}

export function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return ''

  const existing = window.localStorage.getItem(VISITOR_STORAGE_KEY)?.trim()
  if (existing) {
    syncVisitorIdCookie(existing)
    return existing
  }

  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `v_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

  window.localStorage.setItem(VISITOR_STORAGE_KEY, id)
  syncVisitorIdCookie(id)
  return id
}

/** Read visitor id from Cookie header (server). */
export function readVisitorIdFromCookieHeader(
  cookieHeader: string | null | undefined,
): string | undefined {
  if (!cookieHeader) return undefined
  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${VISITOR_COOKIE_NAME}=([^;]+)`),
  )
  if (!match?.[1]) return undefined
  try {
    const value = decodeURIComponent(match[1]).trim()
    return value.length >= 8 && value.length <= 120 ? value : undefined
  } catch {
    return undefined
  }
}
