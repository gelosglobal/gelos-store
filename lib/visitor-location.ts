import { getLocationById, type LocationId } from '@/lib/locations'

const REGION_CITY: Record<LocationId, string> = {
  ghana: 'Accra',
  nigeria: 'Lagos',
  usa: 'New York',
  international: '',
}

const REGION_COUNTRY: Record<LocationId, string> = {
  ghana: 'Ghana',
  nigeria: 'Nigeria',
  usa: 'USA',
  international: 'International',
}

const ISO_COUNTRY: Record<string, { name: string; flag: string; locationId?: LocationId }> = {
  gh: { name: 'Ghana', flag: '🇬🇭', locationId: 'ghana' },
  ng: { name: 'Nigeria', flag: '🇳🇬', locationId: 'nigeria' },
  us: { name: 'USA', flag: '🇺🇸', locationId: 'usa' },
  gb: { name: 'UK', flag: '🇬🇧' },
  ca: { name: 'Canada', flag: '🇨🇦' },
  de: { name: 'Germany', flag: '🇩🇪' },
  fr: { name: 'France', flag: '🇫🇷' },
}

function decodeGeoHeader(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim()
  if (!trimmed) return undefined
  try {
    return decodeURIComponent(trimmed)
  } catch {
    return trimmed
  }
}

function normalizeCountryCode(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  if (!trimmed) return undefined
  return trimmed.toLowerCase()
}

function resolveCountryMeta(country?: string | null) {
  const code = normalizeCountryCode(country)
  if (!code) return undefined

  if (ISO_COUNTRY[code]) return ISO_COUNTRY[code]

  const byName = Object.values(ISO_COUNTRY).find(
    (entry) => entry.name.toLowerCase() === code,
  )
  if (byName) return byName

  return { name: country!.trim(), flag: '🌍' as const }
}

export function getGeoFromRequestHeaders(headers: Headers): {
  city?: string
  country?: string
} {
  const city = decodeGeoHeader(
    headers.get('x-vercel-ip-city') ??
      headers.get('cf-ipcity') ??
      headers.get('x-nf-client-connection-ip-city'),
  )
  const country = decodeGeoHeader(
    headers.get('x-vercel-ip-country') ??
      headers.get('cf-ipcountry') ??
      headers.get('x-nf-client-connection-ip-country'),
  )

  return { city, country }
}

export function isLocationId(value: string | undefined | null): value is LocationId {
  return (
    value === 'ghana' ||
    value === 'nigeria' ||
    value === 'usa' ||
    value === 'international'
  )
}

export function formatVisitorLocationLabel(input: {
  locationId?: string | null
  city?: string | null
  country?: string | null
}): string {
  const city = input.city?.trim()
  const countryMeta = resolveCountryMeta(input.country)
  const countryName = countryMeta?.name ?? input.country?.trim()

  if (city && countryName) {
    return `${city}, ${countryName}`
  }

  if (isLocationId(input.locationId)) {
    const regionCity = REGION_CITY[input.locationId]
    const regionCountry = REGION_COUNTRY[input.locationId]
    if (regionCity) return `${regionCity}, ${regionCountry}`
    return regionCountry
  }

  if (countryName) return countryName
  if (city) return city

  return 'Unknown location'
}

export function getVisitorLocationDisplayLabel(input: {
  locationId?: string | null
  city?: string | null
  country?: string | null
}): string {
  const city = input.city?.trim()
  const countryMeta = resolveCountryMeta(input.country)

  if (isLocationId(input.locationId)) {
    const regionCity = REGION_CITY[input.locationId]
    const regionCountry = REGION_COUNTRY[input.locationId]
    if (regionCity && (!city || city === regionCity)) {
      return `${regionCity}, ${regionCountry}`
    }
    return getLocationById(input.locationId)?.shortLabel ?? regionCountry
  }

  if (city && countryMeta?.name) {
    return `${city}, ${countryMeta.name}`
  }

  if (countryMeta?.name) return countryMeta.name
  if (city) return city

  return 'Unknown'
}

export function getVisitorLocationFlag(input: {
  locationId?: string | null
  country?: string | null
}): string {
  if (isLocationId(input.locationId)) {
    return getLocationById(input.locationId)?.flag ?? '🌍'
  }

  return resolveCountryMeta(input.country)?.flag ?? '🌍'
}

export function resolveVisitorLocation(input: {
  locationId?: string | null
  geoCity?: string | null
  geoCountry?: string | null
}): {
  locationId?: string
  city: string
  country: string
  label: string
  displayLabel: string
  flag: string
} {
  const locationId = isLocationId(input.locationId) ? input.locationId : undefined
  const geoCity = input.geoCity?.trim()
  const geoCountry = input.geoCountry?.trim()
  const countryMeta = resolveCountryMeta(geoCountry)

  if (geoCountry) {
    const countryName = countryMeta?.name ?? geoCountry
    const resolvedLocationId = locationId ?? countryMeta?.locationId

    return {
      locationId: resolvedLocationId,
      city: geoCity ?? '',
      country: countryName,
      label: formatVisitorLocationLabel({
        locationId: resolvedLocationId,
        city: geoCity,
        country: countryName,
      }),
      displayLabel: getVisitorLocationDisplayLabel({
        locationId: resolvedLocationId,
        city: geoCity,
        country: countryName,
      }),
      flag: getVisitorLocationFlag({
        locationId: resolvedLocationId,
        country: countryName,
      }),
    }
  }

  if (locationId) {
    const city = REGION_CITY[locationId]
    const country = REGION_COUNTRY[locationId]
    return {
      locationId,
      city,
      country,
      label: formatVisitorLocationLabel({ locationId, city, country }),
      displayLabel: getVisitorLocationDisplayLabel({ locationId, city, country }),
      flag: getVisitorLocationFlag({ locationId, country }),
    }
  }

  return {
    locationId,
    city: '',
    country: '',
    label: 'Unknown location',
    displayLabel: 'Unknown',
    flag: '🌍',
  }
}
