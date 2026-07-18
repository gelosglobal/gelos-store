import { convertFromBase as convertFromBaseSync } from '@/lib/exchange-rates'
import { getAllMarketSettings } from '@/lib/db/market-settings'
import {
  marketRatesToCurrencyMap,
  type AllMarketSettings,
} from '@/lib/market-settings'
import type { LocationId } from '@/lib/locations'
import { getCurrencyForLocation } from '@/lib/checkout'

let cachedMarketRates: Record<string, number> | null = null
let cacheLoadedAt = 0
const CACHE_TTL_MS = 30_000

export async function loadMarketExchangeRates(
  markets?: AllMarketSettings,
): Promise<Record<string, number>> {
  const all = markets ?? (await getAllMarketSettings())
  const rates = marketRatesToCurrencyMap(all)
  cachedMarketRates = rates
  cacheLoadedAt = Date.now()
  return rates
}

export async function getMarketExchangeRates(): Promise<Record<string, number>> {
  if (
    cachedMarketRates &&
    Date.now() - cacheLoadedAt < CACHE_TTL_MS
  ) {
    return cachedMarketRates
  }
  return loadMarketExchangeRates()
}

export async function convertFromBaseWithMarkets(
  amount: number,
  targetCurrency: string,
): Promise<number> {
  const rates = await getMarketExchangeRates()
  const currency = targetCurrency.toUpperCase()
  const rate = rates[currency]
  if (!rate) return convertFromBaseSync(amount, targetCurrency)
  return Math.round(amount * rate * 100) / 100
}

export async function convertForLocationWithMarkets(
  amount: number,
  locationId: LocationId,
): Promise<number> {
  return convertFromBaseWithMarkets(amount, getCurrencyForLocation(locationId))
}
