import { countryCodeFromLabel } from '@/lib/country-currency'
import type { ShippingDetails } from '@/lib/dhl/types'
import { clip } from '@/lib/dhl/text'

export function shippingDetailsFromCheckout(
  shipping?: {
    countryCode: string
    city: string
    postalCode?: string
    addressLine1?: string
    productCode?: string
  },
): ShippingDetails | undefined {
  if (!shipping?.countryCode || !shipping.city) return undefined
  const countryCode = countryCodeFromLabel(shipping.countryCode)
  if (!countryCode) return undefined
  return {
    countryCode,
    city: shipping.city.trim(),
    postalCode: shipping.postalCode,
    addressLine1: shipping.addressLine1,
    productCode: shipping.productCode,
  }
}

function looksLikePostal(value: string | undefined, remainingParts: number): boolean {
  if (!value) return false
  const compact = value.replace(/\s+/g, '')
  return /[\d]/.test(value) && compact.length <= 12 && remainingParts >= 2
}

export function parseShippingAddress(
  shippingAddress?: string | null,
  fallback?: Partial<ShippingDetails>,
): ShippingDetails | undefined {
  const parts = (shippingAddress ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)

  const last = parts[parts.length - 1]
  const countryFromAddress = countryCodeFromLabel(last)

  const countryCode =
    countryFromAddress ||
    countryCodeFromLabel(fallback?.countryCode) ||
    ''
  if (!countryCode) return undefined

  const withoutCountry = countryFromAddress ? parts.slice(0, -1) : parts
  const maybePostal = withoutCountry[withoutCountry.length - 1]
  const postalLooksValid = looksLikePostal(maybePostal, withoutCountry.length)

  const postalCode =
    fallback?.postalCode || (postalLooksValid ? maybePostal : undefined)
  const cityParts = postalLooksValid
    ? withoutCountry.slice(0, -1)
    : withoutCountry
  const rawCity =
    fallback?.city ||
    cityParts[cityParts.length - 1] ||
    cityParts[0] ||
    ''
  const city = rawCity.replace(/\s+[A-Z]{2}$/i, '').trim()
  const addressLine1 =
    fallback?.addressLine1 ||
    (cityParts.length > 1 ? cityParts.slice(0, -1).join(', ') : cityParts[0])

  if (!city || city.length < 2) return undefined

  return {
    countryCode,
    city,
    postalCode: postalCode || undefined,
    addressLine1: addressLine1 || undefined,
    productCode: fallback?.productCode,
  }
}

export function resolveShippingDetails(input: {
  shippingDetails?: unknown
  shippingAddress?: string | null
  fallbackCountry?: string
}): ShippingDetails | undefined {
  const stored = asShippingDetails(input.shippingDetails)
  const parsed = parseShippingAddress(input.shippingAddress, {
    countryCode: stored?.countryCode || input.fallbackCountry,
    city: stored?.city,
    postalCode: stored?.postalCode,
    addressLine1: stored?.addressLine1,
    productCode: stored?.productCode,
  })
  if (!stored && !parsed) return undefined
  const countryCode =
    countryCodeFromLabel(stored?.countryCode) ||
    countryCodeFromLabel(parsed?.countryCode) ||
    countryCodeFromLabel(input.fallbackCountry) ||
    ''
  const city = stored?.city || parsed?.city || ''
  if (!countryCode || city.length < 2) return undefined
  return {
    countryCode,
    city,
    postalCode: stored?.postalCode || parsed?.postalCode,
    addressLine1: stored?.addressLine1 || parsed?.addressLine1,
    countyName: stored?.countyName || parsed?.countyName,
    productCode: stored?.productCode || parsed?.productCode,
  }
}

export function asShippingDetails(value: unknown): ShippingDetails | undefined {
  if (!value || typeof value !== 'object') return undefined
  const record = value as Record<string, unknown>
  const countryCode =
    countryCodeFromLabel(
      typeof record.countryCode === 'string' ? record.countryCode : undefined,
    ) ?? ''
  const city = typeof record.city === 'string' ? record.city.trim() : ''
  if (!countryCode || city.length < 2) return undefined
  return {
    countryCode,
    city,
    postalCode:
      typeof record.postalCode === 'string'
        ? record.postalCode.trim() || undefined
        : undefined,
    addressLine1:
      typeof record.addressLine1 === 'string'
        ? record.addressLine1.trim() || undefined
        : undefined,
    countyName:
      typeof record.countyName === 'string'
        ? record.countyName.trim() || undefined
        : undefined,
    productCode:
      typeof record.productCode === 'string'
        ? record.productCode.trim() || undefined
        : undefined,
  }
}

export function dhlTrackingUrl(trackingNumber: string): string {
  return `https://www.dhl.com/global-en/home/tracking.html?tracking-id=${encodeURIComponent(trackingNumber)}`
}

export function addressLine(value: string | undefined, fallback: string): string {
  return clip(value?.trim() || fallback, 45)
}
