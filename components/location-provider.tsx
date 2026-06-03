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
  defaultLocationId,
  getLocationById,
  type Location,
  type LocationId,
} from '@/lib/locations'
import { formatPrice as formatPriceBase } from '@/lib/format-price'

const STORAGE_KEY = 'gelos-location'

type LocationContextValue = {
  location: Location
  locationId: LocationId
  setLocationId: (id: LocationId) => void
  isHydrated: boolean
  formatPrice: (amount: number) => string
}

const LocationContext = createContext<LocationContextValue | null>(null)

function readStoredLocationId(): LocationId {
  if (typeof window === 'undefined') return defaultLocationId
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    const match = getLocationById(stored ?? '')
    return match?.id ?? defaultLocationId
  } catch {
    return defaultLocationId
  }
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const [locationId, setLocationIdState] = useState<LocationId>(defaultLocationId)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setLocationIdState(readStoredLocationId())
    setIsHydrated(true)
  }, [])

  const setLocationId = useCallback((id: LocationId) => {
    setLocationIdState(id)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, id)
    }
  }, [])

  const location = useMemo(
    () => getLocationById(locationId) ?? getLocationById(defaultLocationId)!,
    [locationId],
  )

  const formatPrice = useCallback(
    (amount: number) => formatPriceBase(amount, location),
    [location],
  )

  const value = useMemo(
    () => ({
      location,
      locationId,
      setLocationId,
      isHydrated,
      formatPrice,
    }),
    [location, locationId, setLocationId, isHydrated, formatPrice],
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
