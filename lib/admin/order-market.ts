import {
  countryFlagEmoji,
  countryName,
  normalizeCountryCode,
} from '@/lib/country-currency'
import {
  canonicalizeLocationId,
  defaultLocationId,
  getLocationById,
  type LocationId,
} from '@/lib/locations'
import { usesLiveDhlRates } from '@/lib/market-settings'

export type OrderMarketDisplay = {
  locationId: LocationId
  marketLabel: string
  marketFlag: string
  destinationCountry?: string
  destinationCountryCode?: string
  destinationFlag?: string
  showDestination?: boolean
}

function locationIdFromCurrency(
  currency: string | null | undefined,
): LocationId | undefined {
  const code = currency?.trim().toUpperCase()
  if (code === 'GHS') return 'ghana'
  if (code === 'USD') return 'usa'
  if (code === 'NGN') return 'international'
  if (code) return 'international'
  return undefined
}

export function shippingCountryFromOrder(input: {
  shippingDetails?: unknown
  shippingAddress?: string | null
}): string | undefined {
  if (input.shippingDetails && typeof input.shippingDetails === 'object') {
    const record = input.shippingDetails as Record<string, unknown>
    const fromDetails = normalizeCountryCode(
      typeof record.countryCode === 'string' ? record.countryCode : undefined,
    )
    if (fromDetails) return fromDetails
  }

  const last = input.shippingAddress
    ?.split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .at(-1)
  return normalizeCountryCode(last)
}

export function resolveOrderLocationId(input: {
  locationId?: string | null
  currency?: string | null
  shippingCountry?: string | null
}): LocationId {
  const stored = canonicalizeLocationId(input.locationId ?? undefined)
  if (stored) return stored

  const country = normalizeCountryCode(input.shippingCountry)
  if (country === 'GH') return 'ghana'
  if (country === 'US') return 'usa'
  if (country) return 'international'

  return locationIdFromCurrency(input.currency) ?? defaultLocationId
}

export function orderMarketDisplay(input: {
  locationId?: string | null
  currency?: string | null
  shippingCountry?: string | null
}): OrderMarketDisplay {
  const locationId = resolveOrderLocationId(input)
  const location = getLocationById(locationId)
  const country = normalizeCountryCode(input.shippingCountry)
  const homeCountry =
    locationId === 'ghana' ? 'GH' : locationId === 'usa' ? 'US' : undefined
  const resolvedCountry = country ?? homeCountry
  const showDestination = Boolean(country && country !== homeCountry)

  return {
    locationId,
    marketLabel: location?.label ?? 'Ghana',
    marketFlag: location?.flag ?? '🇬🇭',
    destinationCountry: resolvedCountry
      ? countryName(resolvedCountry)
      : undefined,
    destinationCountryCode: resolvedCountry,
    destinationFlag: resolvedCountry
      ? countryFlagEmoji(resolvedCountry)
      : undefined,
    showDestination,
  }
}

const COUNTRY_SEARCH_ALIASES: Record<string, string[]> = {
  US: ['usa', 'us', 'united states', 'america'],
  GB: ['uk', 'gb', 'united kingdom', 'britain', 'england'],
  AE: ['uae', 'united arab emirates'],
  GH: ['ghana', 'gh'],
  NG: ['nigeria', 'ng'],
  ZA: ['south africa'],
  KR: ['korea', 'south korea'],
}

function countrySearchHaystack(input: {
  locationId: LocationId
  marketLabel: string
  destinationCountry?: string
  destinationCountryCode?: string
}): string {
  const code = input.destinationCountryCode?.toUpperCase()
  const parts = [
    input.marketLabel,
    input.locationId,
    input.destinationCountry,
    input.destinationCountryCode,
    ...(code ? (COUNTRY_SEARCH_ALIASES[code] ?? []) : []),
  ]
  if (input.locationId === 'usa' && code !== 'US') {
    parts.push(...COUNTRY_SEARCH_ALIASES.US)
  }
  if (input.locationId === 'ghana' && code !== 'GH') {
    parts.push(...COUNTRY_SEARCH_ALIASES.GH)
  }
  return parts.filter(Boolean).join(' ').toLowerCase()
}

export function orderMatchesCountryQuery(
  order: {
    locationId: LocationId
    marketLabel: string
    destinationCountry?: string
    destinationCountryCode?: string
  },
  query: string,
): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return countrySearchHaystack(order).includes(q)
}

export function deliveryMethodForOrder(
  locationId: LocationId,
  channel: string,
): string {
  if (usesLiveDhlRates(locationId)) return 'DHL Express'
  if (/cash on delivery/i.test(channel)) return 'Cash on delivery'
  if (/paystack/i.test(channel)) return 'Online payment'
  if (/whatsapp/i.test(channel)) return 'Standard shipping'
  return 'Standard shipping'
}
