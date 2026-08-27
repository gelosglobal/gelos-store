export type LocationId = 'international' | 'nigeria' | 'ghana' | 'usa'

export type Location = {
  id: LocationId
  label: string
  /** Shown in the compact header trigger */
  shortLabel: string
  currency: string
  currencyCode: string
  flag: string
}

export const locations: Location[] = [
  {
    id: 'ghana',
    label: 'Ghana',
    shortLabel: 'Ghana',
    currency: 'GH₵',
    currencyCode: 'GHS',
    flag: '🇬🇭',
  },
  {
    id: 'usa',
    label: 'USA',
    shortLabel: 'USA',
    currency: '$',
    currencyCode: 'USD',
    flag: '🇺🇸',
  },
  {
    id: 'international',
    label: 'International',
    shortLabel: 'International',
    currency: '$',
    currencyCode: 'USD',
    flag: '🌍',
  },
]

/** Dedicated storefront markets; International follows shopper geo. */
export const primaryLocationIds: LocationId[] = ['ghana', 'usa', 'international']

export const defaultLocationId: LocationId = 'ghana'

/** Fold retired Nigeria market into International (kept on LocationId for old orders). */
export function canonicalizeLocationId(id: string | null | undefined): LocationId | undefined {
  if (id === 'nigeria') return 'international'
  return getLocationById(id ?? '')?.id
}

export function getLocationById(id: string): Location | undefined {
  return locations.find((loc) => loc.id === id)
}

export function withLocationCurrency(
  location: Location,
  currencyCode: string,
  currencySymbol: string,
): Location {
  return {
    ...location,
    currencyCode,
    currency: currencySymbol,
  }
}
