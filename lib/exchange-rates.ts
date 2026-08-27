import { getCurrencyForLocation } from '@/lib/checkout'
import type { LocationId } from '@/lib/locations'

/** Catalog prices in the database are stored in this currency. */
export const BASE_CURRENCY = 'GHS'

/**
 * Approximate local units per 1 USD. Used when a shopper's currency is not
 * one of the dedicated markets (GHS / USD / NGN). Live rates overlay this.
 */
export const USD_TO_LOCAL: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.78,
  CAD: 1.38,
  AUD: 1.53,
  NZD: 1.67,
  CHF: 0.8,
  AED: 3.67,
  SAR: 3.75,
  QAR: 3.64,
  KWD: 0.31,
  OMR: 0.38,
  ZAR: 18.2,
  KES: 129,
  TZS: 2600,
  UGX: 3600,
  RWF: 1450,
  EGP: 49,
  MAD: 10.1,
  TND: 3.1,
  ETB: 57,
  MUR: 46,
  GMD: 72,
  SLE: 22.6,
  LRD: 200,
  NAD: 18.2,
  BWP: 13.6,
  MWK: 1750,
  ZMW: 28,
  NGN: 1600,
  XOF: 605,
  XAF: 605,
  INR: 86,
  PKR: 278,
  PHP: 58,
  THB: 34,
  MYR: 4.4,
  SGD: 1.35,
  HKD: 7.8,
  CNY: 7.25,
  JPY: 150,
  KRW: 1380,
  MXN: 19.2,
  BRL: 5.5,
  CLP: 950,
  JMD: 156,
  ILS: 3.7,
  TRY: 39,
  PLN: 3.9,
  CZK: 23,
  HUF: 360,
  RON: 4.55,
  SEK: 10.5,
  NOK: 10.6,
  DKK: 6.9,
}

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
let liveUsdToLocal: Record<string, number> | null = null

/** Apply rates from market settings (client provider or server cache). */
export function setRuntimeExchangeRates(
  rates: Record<string, number> | null,
): void {
  runtimeRates = rates
}

/** Overlay live USD→local quotes used to derive GHS→shopper currency. */
export function setLiveUsdToLocalRates(
  rates: Record<string, number> | null,
): void {
  liveUsdToLocal = rates
}

export function applyUsdPivotRates(
  baseRates: Record<string, number>,
  usdToLocal?: Record<string, number> | null,
): Record<string, number> {
  const usd = baseRates.USD
  const merged: Record<string, number> = { ...baseRates }
  if (!usd || usd <= 0) return merged

  const crosses = { ...USD_TO_LOCAL, ...(usdToLocal ?? {}) }
  for (const [code, usdToTarget] of Object.entries(crosses)) {
    if (!Number.isFinite(usdToTarget) || usdToTarget <= 0) continue
    if (merged[code] != null) continue
    merged[code] = Math.round(usd * usdToTarget * 1e8) / 1e8
  }
  return merged
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
  return applyUsdPivotRates(
    { ...getEnvRates(), ...(runtimeRates ?? {}) },
    liveUsdToLocal,
  )
}

export function hasExchangeRate(currencyCode: string): boolean {
  const rate = getRates()[currencyCode.trim().toUpperCase()]
  return Boolean(rate && rate > 0)
}

const PAYSTACK_CURRENCIES = new Set(['GHS', 'NGN', 'USD', 'ZAR', 'KES'])

export function getSupportedPaystackCurrencies(): string[] {
  return [...PAYSTACK_CURRENCIES]
}

export function toPaystackChargeCurrency(displayCurrency: string): string {
  const code = displayCurrency.trim().toUpperCase()
  return PAYSTACK_CURRENCIES.has(code) ? code : 'USD'
}

export function convertFromBase(
  amount: number,
  targetCurrency: string,
): number {
  const currency = targetCurrency.toUpperCase()
  const rates = getRates()
  const rate = rates[currency]
  if (rate) return Math.round(amount * rate * 100) / 100
  const usd = rates.USD
  if (usd && currency !== BASE_CURRENCY) {
    return Math.round(amount * usd * 100) / 100
  }
  return amount
}

export function convertForLocation(
  amount: number,
  locationId: LocationId,
  currencyCode?: string,
): number {
  return convertFromBase(
    amount,
    currencyCode ?? getCurrencyForLocation(locationId),
  )
}

export function getPaystackCurrencyForLocation(locationId: LocationId): string {
  return toPaystackChargeCurrency(getCurrencyForLocation(locationId))
}
