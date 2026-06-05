'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  DEFAULT_STORE_PROMOTIONS,
  type StorePromotions,
} from '@/lib/store-promotions'

const PROMO_STORAGE_KEY = 'gelos-applied-promo'

type StorePromotionsContextValue = {
  promotions: StorePromotions
  loading: boolean
  appliedPromoCode: string
  setAppliedPromoCode: (code: string) => void
  refresh: () => Promise<void>
}

const StorePromotionsContext =
  createContext<StorePromotionsContextValue | null>(null)

function readStoredPromoCode(): string {
  if (typeof window === 'undefined') return ''
  return sessionStorage.getItem(PROMO_STORAGE_KEY)?.trim() ?? ''
}

export function StorePromotionsProvider({ children }: { children: ReactNode }) {
  const [promotions, setPromotions] = useState<StorePromotions>(
    DEFAULT_STORE_PROMOTIONS,
  )
  const [loading, setLoading] = useState(true)
  const [appliedPromoCode, setAppliedPromoCodeState] = useState('')

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/store/promotions', { cache: 'no-store' })
      if (!res.ok) return
      const data = (await res.json()) as StorePromotions
      setPromotions(data)
    } catch {
      setPromotions(DEFAULT_STORE_PROMOTIONS)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    setAppliedPromoCodeState(readStoredPromoCode())
  }, [refresh])

  const setAppliedPromoCode = useCallback((code: string) => {
    const trimmed = code.trim()
    setAppliedPromoCodeState(trimmed)
    if (typeof window === 'undefined') return
    if (trimmed) {
      sessionStorage.setItem(PROMO_STORAGE_KEY, trimmed)
    } else {
      sessionStorage.removeItem(PROMO_STORAGE_KEY)
    }
  }, [])

  return (
    <StorePromotionsContext.Provider
      value={{
        promotions,
        loading,
        appliedPromoCode,
        setAppliedPromoCode,
        refresh,
      }}
    >
      {children}
    </StorePromotionsContext.Provider>
  )
}

export function useStorePromotions() {
  const context = useContext(StorePromotionsContext)
  if (!context) {
    throw new Error(
      'useStorePromotions must be used within StorePromotionsProvider',
    )
  }
  return context
}
