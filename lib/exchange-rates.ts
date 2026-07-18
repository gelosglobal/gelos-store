import { getCurrencyForLocation } from '@/lib/checkout'
import type { LocationId } from '@/lib/locations'

/** Catalog prices in the database are stored in this currency. */
export const BASE_CURRENCY = 'GHS'

/**
 * Target currency units received per 1 GHS.
 * Override via EXCHANGE_RATES JSON in env, e.g.
 * EXCHANGE_RATES={"USD":0.064,"NGN":108,"GHS":1}
 * Admin market settings can also override rates at runtime (client + server cache).
 */
const DEFAULT_RATES: Record<string, number> = {
  GHS: 1,
  USD: 0.064,
  NGN: 108,
}

let runtimeRates: Record<string, number> | null = null

/** Apply rates from market settings (client provider or server cache). */
export function setRuntimeExchangeRates(
  rates: Record<string, number> | null,
): void {
  runtimeRates = rates
}

function getEnvRates(): Record<string, number> {
  const raw = process.env.EXCHANGE_RATES?.trim()
  if (!raw) return DEFAULT_RATES

  try {
    const parsed = JSON.parse(raw) as Record<string, number>
    return { ...DEFAULT_RATES, ...parsed }
  } catch {
    console.warn('[exchange-rates] Invalid EXCHANGE_RATES JSON — using defaults')
    return DEFAULT_RATES
  }
}

function getRates(): Record<string, number> {
  return { ...getEnvRates(), ...(runtimeRates ?? {}) }
}

export function getSupportedPaystackCurrencies(): string[] {
  return Object.keys(getRates())
}

export function convertFromBase(
  amount: number,
  targetCurrency: string,
): number {
  const currency = targetCurrency.toUpperCase()
  const rate = getRates()[currency]
  if (!rate) return amount
  return Math.round(amount * rate * 100) / 100
}

export function convertForLocation(
  amount: number,
  locationId: LocationId,
): number {
  return convertFromBase(amount, getCurrencyForLocation(locationId))
}

export function getPaystackCurrencyForLocation(locationId: LocationId): string {
  return getCurrencyForLocation(locationId)
}
