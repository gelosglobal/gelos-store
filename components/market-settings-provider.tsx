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
import { useLocation } from '@/components/location-provider'
import { setRuntimeExchangeRates } from '@/lib/exchange-rates'
import {
  applyMarketShipping,
  DEFAULT_ALL_MARKET_SETTINGS,
  isProductAvailableInMarket,
  marketRatesToCurrencyMap,
  type AllMarketSettings,
  type MarketSettings,
} from '@/lib/market-settings'
import type { StorePromotions } from '@/lib/store-promotions'
import { getWhatsAppChatUrl, normalizeWhatsAppNumber } from '@/lib/whatsapp'

type MarketSettingsContextValue = {
  markets: AllMarketSettings
  market: MarketSettings
  loading: boolean
  refresh: () => Promise<void>
  applyShipping: (promotions: StorePromotions) => StorePromotions
  isProductAvailable: (productId: string) => boolean
  whatsappChatUrl: (message?: string) => string | null
  hasWhatsApp: boolean
}

const MarketSettingsContext =
  createContext<MarketSettingsContextValue | null>(null)

export function MarketSettingsProvider({ children }: { children: ReactNode }) {
  const { locationId } = useLocation()
  const [markets, setMarkets] = useState<AllMarketSettings>(
    DEFAULT_ALL_MARKET_SETTINGS,
  )
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/store/markets')
      if (!res.ok) return
      const data = (await res.json()) as { markets?: AllMarketSettings }
      if (!data.markets) return
      setMarkets(data.markets)
      setRuntimeExchangeRates(marketRatesToCurrencyMap(data.markets))
    } catch {
      setMarkets(DEFAULT_ALL_MARKET_SETTINGS)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const market = markets[locationId] ?? DEFAULT_ALL_MARKET_SETTINGS[locationId]

  const applyShipping = useCallback(
    (promotions: StorePromotions) => applyMarketShipping(promotions, market),
    [market],
  )

  const isProductAvailable = useCallback(
    (productId: string) => isProductAvailableInMarket(productId, market),
    [market],
  )

  const whatsappChatUrl = useCallback(
    (message?: string) => {
      const marketNumber = market.whatsappNumber
        ? normalizeWhatsAppNumber(market.whatsappNumber)
        : null
      if (marketNumber) {
        const text =
          message?.trim() ||
          market.whatsappMessage.trim() ||
          "Hi Gelos! I'd like some help with my order."
        return `https://wa.me/${marketNumber}?${new URLSearchParams({ text }).toString()}`
      }
      return getWhatsAppChatUrl(message || market.whatsappMessage || undefined)
    },
    [market.whatsappMessage, market.whatsappNumber],
  )

  const hasWhatsApp = Boolean(whatsappChatUrl())

  const value = useMemo(
    () => ({
      markets,
      market,
      loading,
      refresh,
      applyShipping,
      isProductAvailable,
      whatsappChatUrl,
      hasWhatsApp,
    }),
    [
      applyShipping,
      hasWhatsApp,
      isProductAvailable,
      loading,
      market,
      markets,
      refresh,
      whatsappChatUrl,
    ],
  )

  return (
    <MarketSettingsContext.Provider value={value}>
      {children}
    </MarketSettingsContext.Provider>
  )
}

export function useMarketSettings() {
  const context = useContext(MarketSettingsContext)
  if (!context) {
    throw new Error(
      'useMarketSettings must be used within a MarketSettingsProvider',
    )
  }
  return context
}
