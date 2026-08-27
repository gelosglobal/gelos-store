import { listShipToCountries } from '@/lib/country-currency'
import type { LocationId } from '@/lib/locations'

/** ISO 3166-1 alpha-2 for Gelos markets (international has no fixed country). */
export function countryCodeFromLocation(
  locationId: LocationId | string,
): string | undefined {
  switch (locationId) {
    case 'ghana':
      return 'GH'
    case 'nigeria':
      return 'NG'
    case 'usa':
      return 'US'
    case 'international':
      return undefined
    default:
      return undefined
  }
}

const FEATURED_INTERNATIONAL_CODES = [
  'NG',
  'GB',
  'CA',
  'DE',
  'FR',
  'NL',
  'AE',
  'ZA',
  'KE',
  'AU',
] as const

function asOption(country: {
  code: string
  name: string
}): { code: string; label: string } {
  return { code: country.code, label: country.name }
}

export function internationalCountryOptions(preferredCode?: string): Array<{
  code: string
  label: string
}> {
  const all = listShipToCountries().filter(
    (country) => country.code !== 'GH' && country.code !== 'US',
  )
  const featured = new Set<string>(FEATURED_INTERNATIONAL_CODES)
  const preferred = preferredCode?.trim().toUpperCase()
  if (preferred) featured.add(preferred)

  const featuredRows = [...featured]
    .map((code) => all.find((country) => country.code === code))
    .filter((country): country is (typeof all)[number] => Boolean(country))
    .map(asOption)

  const rest = all
    .filter((country) => !featured.has(country.code))
    .map(asOption)

  const extras =
    preferred &&
    preferred.length === 2 &&
    !all.some((country) => country.code === preferred) &&
    preferred !== 'GH' &&
    preferred !== 'US'
      ? [{ code: preferred, label: preferred }]
      : []

  return [...extras, ...featuredRows, ...rest]
}

/** @deprecated Use internationalCountryOptions() — kept for existing imports. */
export const INTERNATIONAL_COUNTRY_OPTIONS = internationalCountryOptions()
