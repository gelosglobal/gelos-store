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
    id: 'international',
    label: 'International',
    shortLabel: 'International',
    currency: '$',
    currencyCode: 'USD',
    flag: '🌍',
  },
  {
    id: 'nigeria',
    label: 'Nigeria',
    shortLabel: 'Nigeria',
    currency: '₦',
    currencyCode: 'NGN',
    flag: '🇳🇬',
  },
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
]

export const defaultLocationId: LocationId = 'ghana'

export function getLocationById(id: string): Location | undefined {
  return locations.find((loc) => loc.id === id)
}
