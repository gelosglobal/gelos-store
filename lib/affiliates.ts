export function normalizeAffiliateCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '')
}

export function validateAffiliateReferralCode(code: string): string | null {
  const normalized = normalizeAffiliateCode(code)
  if (normalized.length < 3) {
    return 'Code must be at least 3 characters.'
  }
  if (normalized.length > 24) {
    return 'Code is too long.'
  }
  if (!/^[A-Z0-9_-]+$/.test(normalized)) {
    return 'Use letters, numbers, hyphens, or underscores only.'
  }
  return null
}

export function calculateAffiliateCommission(
  orderTotal: number,
  commissionPercent: number,
): number {
  if (orderTotal <= 0 || commissionPercent <= 0) return 0
  return Math.round(orderTotal * (commissionPercent / 100) * 100) / 100
}

export function buildAffiliateReferralUrl(
  code: string,
  baseUrl?: string,
): string {
  const origin =
    baseUrl?.replace(/\/$/, '') ||
    (typeof window !== 'undefined' ? window.location.origin : '')
  const normalized = normalizeAffiliateCode(code)
  return origin ? `${origin}/?ref=${encodeURIComponent(normalized)}` : `/?ref=${normalized}`
}

export function buildAffiliateDashboardUrl(
  baseUrl?: string,
): string {
  const origin =
    baseUrl?.replace(/\/$/, '') ||
    (typeof window !== 'undefined' ? window.location.origin : '')
  return origin ? `${origin}/affiliate/dashboard` : '/affiliate/dashboard'
}

export function buildAffiliateLoginUrl(baseUrl?: string): string {
  const origin =
    baseUrl?.replace(/\/$/, '') ||
    (typeof window !== 'undefined' ? window.location.origin : '')
  return origin ? `${origin}/affiliate/login` : '/affiliate/login'
}

export function buildAffiliateSignupUrl(
  email?: string,
  baseUrl?: string,
): string {
  const origin =
    baseUrl?.replace(/\/$/, '') ||
    (typeof window !== 'undefined' ? window.location.origin : '')
  const url = new URL('/affiliate/signup', origin || 'http://localhost')
  const normalizedEmail = email?.trim().toLowerCase()
  if (normalizedEmail) {
    url.searchParams.set('email', normalizedEmail)
  }
  return origin ? url.toString() : url.pathname + url.search
}

export function buildProductShareUrl(
  productPath: string,
  baseUrl?: string,
): string {
  const origin =
    baseUrl?.replace(/\/$/, '') ||
    (typeof window !== 'undefined' ? window.location.origin : '')
  const path = productPath.startsWith('/') ? productPath : `/${productPath}`
  return origin ? `${origin}${path}` : path
}

export function buildAffiliateProductUrl(
  productPath: string,
  code: string,
  baseUrl?: string,
): string {
  const url = new URL(
    buildProductShareUrl(productPath, baseUrl || 'http://localhost'),
  )
  url.searchParams.set('ref', normalizeAffiliateCode(code))
  return url.toString()
}
