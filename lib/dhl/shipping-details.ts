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
  return {
    countryCode: shipping.countryCode.toUpperCase(),
    city: shipping.city,
    postalCode: shipping.postalCode,
    addressLine1: shipping.addressLine1,
    productCode: shipping.productCode,
  }
}

export function parseShippingAddress(
  shippingAddress?: string | null,
  fallback?: Partial<ShippingDetails>,
): ShippingDetails | undefined {
  const parts = (shippingAddress ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)

  const last = parts[parts.length - 1]?.toUpperCase()
  const countryFromAddress =
    last && last.length === 2 && /^[A-Z]{2}$/.test(last) ? last : undefined

  const countryCode = (
    fallback?.countryCode ||
    countryFromAddress ||
    ''
  ).toUpperCase()
  if (!countryCode || countryCode.length !== 2) return undefined

  const withoutCountry = countryFromAddress ? parts.slice(0, -1) : parts
  const maybePostal = withoutCountry[withoutCountry.length - 1]
  const looksPostal =
    Boolean(maybePostal) &&
    /[\d]/.test(maybePostal!) &&
    maybePostal!.length <= 12 &&
    withoutCountry.length >= 2

  const postalCode = fallback?.postalCode || (looksPostal ? maybePostal : undefined)
  const cityParts = looksPostal
    ? withoutCountry.slice(0, -1)
    : withoutCountry
  const city =
    fallback?.city ||
    cityParts[cityParts.length - 1] ||
    cityParts[0] ||
    ''
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
  const countryCode = stored?.countryCode || parsed?.countryCode || ''
  const city = stored?.city || parsed?.city || ''
  if (countryCode.length !== 2 || city.length < 2) return undefined
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
    typeof record.countryCode === 'string'
      ? record.countryCode.trim().toUpperCase()
      : ''
  const city = typeof record.city === 'string' ? record.city.trim() : ''
  if (countryCode.length !== 2 || city.length < 2) return undefined
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
