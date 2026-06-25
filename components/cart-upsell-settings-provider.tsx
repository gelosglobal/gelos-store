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
  DEFAULT_CART_UPSELL_SETTINGS,
  type CartUpsellSettings,
} from '@/lib/cart-upsell-settings'

type CartUpsellSettingsContextValue = {
  settings: CartUpsellSettings
  loading: boolean
  refresh: () => Promise<void>
}

const CartUpsellSettingsContext =
  createContext<CartUpsellSettingsContextValue | null>(null)

export function CartUpsellSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<CartUpsellSettings>(
    DEFAULT_CART_UPSELL_SETTINGS,
  )
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/store/cart-upsells', { cache: 'no-store' })
      if (!res.ok) return
      const data = (await res.json()) as CartUpsellSettings
      setSettings(data)
    } catch {
      setSettings(DEFAULT_CART_UPSELL_SETTINGS)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return (
    <CartUpsellSettingsContext.Provider
      value={{ settings, loading, refresh }}
    >
      {children}
    </CartUpsellSettingsContext.Provider>
  )
}

export function useCartUpsellSettings() {
  const context = useContext(CartUpsellSettingsContext)
  if (!context) {
    throw new Error(
      'useCartUpsellSettings must be used within CartUpsellSettingsProvider',
    )
  }
  return context
}
