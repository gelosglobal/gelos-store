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

export const INTERNATIONAL_COUNTRY_OPTIONS: Array<{
  code: string
  label: string
}> = [
  { code: 'GB', label: 'United Kingdom' },
  { code: 'CA', label: 'Canada' },
  { code: 'DE', label: 'Germany' },
  { code: 'FR', label: 'France' },
  { code: 'NL', label: 'Netherlands' },
  { code: 'AE', label: 'United Arab Emirates' },
  { code: 'ZA', label: 'South Africa' },
  { code: 'KE', label: 'Kenya' },
  { code: 'AU', label: 'Australia' },
]
