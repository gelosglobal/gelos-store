import {
  currencyForCountry,
  getCountryCurrency,
  normalizeCountryCode,
} from '@/lib/country-currency'
import type { LocationId } from '@/lib/locations'
import { getGeoFromRequestHeaders } from '@/lib/visitor-location'
import {
  clientIpFromHeaders,
  isPublicIp,
} from '@/lib/fx-live'

export type GeoMarket = {
  countryCode: string
  countryName: string
  city: string
  locationId: LocationId
  currencyCode: string
  currencySymbol: string
  flag: string
  detected: boolean
  source: 'header' | 'ip' | 'default'
}

const DEFAULT_GEO: GeoMarket = {
  countryCode: 'GH',
  countryName: 'Ghana',
  city: '',
  locationId: 'ghana',
  currencyCode: 'GHS',
  currencySymbol: 'GH₵',
  flag: '🇬🇭',
  detected: false,
  source: 'default',
}

export function locationIdFromCountryCode(
  countryCode: string | null | undefined,
): LocationId {
  const code = normalizeCountryCode(countryCode)
  if (code === 'GH') return 'ghana'
  if (code === 'US') return 'usa'
  return 'international'
}

export function geoMarketFromCountry(
  countryCode: string | null | undefined,
  city?: string | null,
  source: GeoMarket['source'] = 'header',
): GeoMarket | undefined {
  const country = getCountryCurrency(countryCode)
  if (!country) return undefined
  const locationId = locationIdFromCountryCode(country.code)
  return {
    countryCode: country.code,
    countryName: country.name,
    city: city?.trim() ?? '',
    locationId,
    currencyCode: country.currencyCode,
    currencySymbol: country.currencySymbol,
    flag: country.flag,
    detected: true,
    source,
  }
}

type IpWhoResponse = {
  success?: boolean
  country_code?: string
  country?: string
  city?: string
}

async function lookupIpCountry(
  ip: string | undefined,
): Promise<{ countryCode?: string; city?: string } | undefined> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 2500)
  const url =
    ip && isPublicIp(ip)
      ? `https://ipwho.is/${encodeURIComponent(ip)}`
      : 'https://ipwho.is/'

  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) return undefined
    const data = (await response.json()) as IpWhoResponse
    if (data.success === false) return undefined
    return {
      countryCode: data.country_code,
      city: data.city,
    }
  } catch {
    return undefined
  } finally {
    clearTimeout(timer)
  }
}

export async function resolveGeoMarketFromRequest(
  headers: Headers,
): Promise<GeoMarket> {
  const geo = getGeoFromRequestHeaders(headers)
  const fromHeader = geoMarketFromCountry(geo.country, geo.city, 'header')
  if (fromHeader) return fromHeader

  const ip = clientIpFromHeaders(headers)
  const fromIp = await lookupIpCountry(ip)
  const resolved = geoMarketFromCountry(fromIp?.countryCode, fromIp?.city, 'ip')
  if (resolved) return resolved

  return DEFAULT_GEO
}

export function displayCurrencyForMarket(
  locationId: LocationId,
  geo?: Pick<GeoMarket, 'currencyCode' | 'countryCode'> | null,
): string {
  if (locationId === 'ghana') return 'GHS'
  if (locationId === 'usa') return 'USD'
  return geo?.currencyCode || currencyForCountry(geo?.countryCode) || 'USD'
}

export function fallbackInternationalCountry(
  geo?: Pick<GeoMarket, 'countryCode'> | null,
): string {
  if (geo?.countryCode) return geo.countryCode
  return 'GB'
}

export { currencyForCountry }
