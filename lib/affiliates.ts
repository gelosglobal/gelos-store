export function normalizeAffiliateCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '')
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
