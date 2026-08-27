'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  currencySymbol,
  getCountryCurrency,
} from '@/lib/country-currency'
import {
  setLiveUsdToLocalRates,
  setRuntimeExchangeRates,
} from '@/lib/exchange-rates'
import { formatPrice as formatPriceBase } from '@/lib/format-price'
import type { GeoMarket } from '@/lib/geo-market'
import { displayCurrencyForMarket } from '@/lib/geo-market'
import {
  canonicalizeLocationId,
  defaultLocationId,
  getLocationById,
  withLocationCurrency,
  type Location,
  type LocationId,
} from '@/lib/locations'

const STORAGE_KEY = 'gelos-location'
const SOURCE_KEY = 'gelos-location-source'

type LocationSource = 'auto' | 'manual'

type GeoResponse = GeoMarket & {
  rates?: Record<string, number>
  usdToLocal?: Record<string, number>
}

type LocationContextValue = {
  location: Location
  locationId: LocationId
  setLocationId: (id: LocationId) => void
  isHydrated: boolean
  formatPrice: (amount: number) => string
  geo: GeoMarket | null
  countryCode: string | undefined
}

const LocationContext = createContext<LocationContextValue | null>(null)

function readStoredLocationId(): LocationId | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return canonicalizeLocationId(stored) ?? null
  } catch {
    return null
  }
}

function readStoredSource(): LocationSource | null {
  if (typeof window === 'undefined') return null
  try {
    const value = localStorage.getItem(SOURCE_KEY)
    if (value === 'manual' || value === 'auto') return value
    return null
  } catch {
    return null
  }
}

function persistLocation(id: LocationId, source: LocationSource) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, id)
  localStorage.setItem(SOURCE_KEY, source)
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const [locationId, setLocationIdState] = useState<LocationId>(defaultLocationId)
  const [geo, setGeo] = useState<GeoMarket | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    const storedId = readStoredLocationId()
    const storedSource = readStoredSource()
    if (storedId) {
      setLocationIdState(storedId)
    }

    let cancelled = false
    void fetch('/api/geo', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) return null
        return (await res.json()) as GeoResponse
      })
      .then((data) => {
        if (cancelled || !data?.countryCode) return
        if (data.rates) setRuntimeExchangeRates(data.rates)
        if (data.usdToLocal) setLiveUsdToLocalRates(data.usdToLocal)
        const nextGeo: GeoMarket = {
          countryCode: data.countryCode,
          countryName: data.countryName,
          city: data.city ?? '',
          locationId: data.locationId,
          currencyCode: data.currencyCode,
          currencySymbol: data.currencySymbol,
          flag: data.flag,
          detected: data.detected,
          source: data.source,
        }
        setGeo(nextGeo)

        const shouldApplyGeo = !storedId || storedSource === 'auto'
        if (shouldApplyGeo && data.detected) {
          setLocationIdState(data.locationId)
          persistLocation(data.locationId, 'auto')
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setIsHydrated(true)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const setLocationId = useCallback((id: LocationId) => {
    setLocationIdState(id)
    persistLocation(id, 'manual')
  }, [])

  const location = useMemo(() => {
    const base =
      getLocationById(locationId) ?? getLocationById(defaultLocationId)!
    const currencyCode = displayCurrencyForMarket(locationId, geo)
    const country =
      locationId === 'international' && geo?.locationId === 'international'
        ? getCountryCurrency(geo.countryCode)
        : undefined

    const labeled =
      country && geo?.detected
        ? {
            ...base,
            label: country.name,
            shortLabel: country.name,
            flag: country.flag,
          }
        : base

    return withLocationCurrency(
      labeled,
      currencyCode,
      currencyCode === country?.currencyCode
        ? country.currencySymbol
        : currencySymbol(currencyCode),
    )
  }, [geo, locationId])

  const formatPrice = useCallback(
    (amount: number) => formatPriceBase(amount, location),
    [location],
  )

  const countryCode = useMemo(() => {
    if (locationId === 'ghana') return 'GH'
    if (locationId === 'usa') return 'US'
    return geo?.countryCode
  }, [geo?.countryCode, locationId])

  const value = useMemo(
    () => ({
      location,
      locationId,
      setLocationId,
      isHydrated,
      formatPrice,
      geo,
      countryCode,
    }),
    [
      location,
      locationId,
      setLocationId,
      isHydrated,
      formatPrice,
      geo,
      countryCode,
    ],
  )

  return (
    <LocationContext.Provider value={value}>{children}</LocationContext.Provider>
  )
}

export function useLocation() {
  const context = useContext(LocationContext)
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider')
  }
  return context
}
