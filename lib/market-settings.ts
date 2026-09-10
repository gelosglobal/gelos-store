import type { LocationId } from '@/lib/locations'
import { locations } from '@/lib/locations'
import {
  DEFAULT_USD_PER_GHS,
  LEGACY_USD_PER_GHS,
} from '@/lib/exchange-rates'
import { normalizeWhatsAppNumber } from '@/lib/whatsapp'
import type { StorePromotions } from '@/lib/store-promotions'

export type MarketPaymentMethod = 'paystack' | 'stripe' | 'cod'

export type MarketPayments = {
  paystack: boolean
  stripe: boolean
  cod: boolean
}

export type MarketSettings = {
  locationId: LocationId
  /** When false, hidden from the storefront location picker. */
  enabled: boolean
  currencyCode: string
  /**
   * When false (default for USA / International), prices use live FX.
   * When true, `exchangeRate` is used instead of live quotes.
   */
  customExchangeRate: boolean
  /** Market currency units received per 1 GHS (catalog base). */
  exchangeRate: number
  freeShippingEnabled: boolean
  /** Threshold in GHS (catalog base). */
  freeShippingThreshold: number
  /** Flat shipping fee in GHS (catalog base). */
  shippingFee: number
  /** Digits-only preferred; empty falls back to global env WhatsApp. */
  whatsappNumber: string
  whatsappMessage: string
  payments: MarketPayments
  defaultPaymentMethod: MarketPaymentMethod
  /**
   * When true, only `productIds` are available in this market.
   * When false, the full catalog is available.
   */
  restrictCatalog: boolean
  productIds: string[]
}

export type AllMarketSettings = Record<LocationId, MarketSettings>

const DEFAULT_RATES: Record<LocationId, number> = {
  ghana: 1,
  nigeria: 108,
  usa: DEFAULT_USD_PER_GHS,
  international: DEFAULT_USD_PER_GHS,
}

function defaultPayments(locationId: LocationId): MarketPayments {
  if (locationId === 'usa') {
    return { paystack: false, stripe: true, cod: false }
  }
  // Stripe available in every market; Paystack + COD remain for GH/NG/intl.
  return { paystack: true, stripe: true, cod: true }
}

function defaultPaymentMethod(locationId: LocationId): MarketPaymentMethod {
  // Credit card (Stripe) first when available for the market.
  const payments = defaultPayments(locationId)
  if (payments.stripe) return 'stripe'
  if (payments.paystack) return 'paystack'
  return 'cod'
}

function defaultCustomExchangeRate(locationId: LocationId): boolean {
  // Ghana is catalog base. Nigeria keeps a dedicated admin rate by default.
  // USA / International default to live FX until an admin opts into a custom rate.
  return locationId === 'ghana' || locationId === 'nigeria'
}

export function createDefaultMarketSettings(
  locationId: LocationId,
): MarketSettings {
  const location = locations.find((loc) => loc.id === locationId)
  return {
    locationId,
    enabled: true,
    currencyCode: location?.currencyCode ?? 'GHS',
    customExchangeRate: defaultCustomExchangeRate(locationId),
    exchangeRate: DEFAULT_RATES[locationId],
    freeShippingEnabled: locationId === 'ghana',
    freeShippingThreshold: 200,
    shippingFee: 15,
    whatsappNumber: '',
    whatsappMessage: '',
    payments: defaultPayments(locationId),
    defaultPaymentMethod: defaultPaymentMethod(locationId),
    restrictCatalog: locationId === 'usa',
    productIds: locationId === 'usa' ? ['9', '5'] : [],
  }
}

export function createDefaultAllMarketSettings(): AllMarketSettings {
  return {
    ghana: createDefaultMarketSettings('ghana'),
    nigeria: createDefaultMarketSettings('nigeria'),
    usa: createDefaultMarketSettings('usa'),
    international: createDefaultMarketSettings('international'),
  }
}

export const DEFAULT_ALL_MARKET_SETTINGS = createDefaultAllMarketSettings()

function asBool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function asNumber(value: unknown, fallback: number): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function sanitizePayments(
  input: unknown,
  fallback: MarketPayments,
): MarketPayments {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ...fallback }
  }
  const raw = input as Partial<MarketPayments>
  return {
    paystack: asBool(raw.paystack, fallback.paystack),
    // Prefer Stripe on for all markets when unset (older saves often omitted it).
    stripe: typeof raw.stripe === 'boolean' ? raw.stripe : true,
    cod: asBool(raw.cod, fallback.cod),
  }
}

function sanitizePaymentMethod(
  value: unknown,
  payments: MarketPayments,
  fallback: MarketPaymentMethod,
): MarketPaymentMethod {
  const method =
    value === 'paystack' || value === 'stripe' || value === 'cod'
      ? value
      : fallback
  if (payments[method]) return method
  if (payments.paystack) return 'paystack'
  if (payments.stripe) return 'stripe'
  if (payments.cod) return 'cod'
  return fallback
}

export function sanitizeMarketSettings(
  locationId: LocationId,
  input: Partial<MarketSettings> | null | undefined,
): MarketSettings {
  const defaults = createDefaultMarketSettings(locationId)
  const payments = sanitizePayments(input?.payments, defaults.payments)
  const productIds = Array.isArray(input?.productIds)
    ? input.productIds
        .map((id) => String(id).trim())
        .filter(Boolean)
    : defaults.productIds

  const whatsappRaw = asString(input?.whatsappNumber, defaults.whatsappNumber)
  const normalizedWhatsapp = whatsappRaw
    ? normalizeWhatsAppNumber(whatsappRaw) ?? whatsappRaw.replace(/\D/g, '')
    : ''

  return {
    locationId,
    enabled: asBool(input?.enabled, defaults.enabled),
    currencyCode: asString(input?.currencyCode, defaults.currencyCode)
      .trim()
      .toUpperCase() || defaults.currencyCode,
    customExchangeRate: asBool(
      input?.customExchangeRate,
      defaults.customExchangeRate,
    ),
    exchangeRate: Math.max(0.000001, asNumber(input?.exchangeRate, defaults.exchangeRate)),
    freeShippingEnabled: asBool(
      input?.freeShippingEnabled,
      defaults.freeShippingEnabled,
    ),
    freeShippingThreshold: Math.max(
      0,
      asNumber(input?.freeShippingThreshold, defaults.freeShippingThreshold),
    ),
    shippingFee: Math.max(0, asNumber(input?.shippingFee, defaults.shippingFee)),
    whatsappNumber: normalizedWhatsapp,
    whatsappMessage: asString(input?.whatsappMessage, defaults.whatsappMessage),
    payments,
    defaultPaymentMethod: sanitizePaymentMethod(
      input?.defaultPaymentMethod,
      payments,
      defaults.defaultPaymentMethod,
    ),
    restrictCatalog: asBool(input?.restrictCatalog, defaults.restrictCatalog),
    productIds,
  }
}

export function sanitizeAllMarketSettings(
  input: unknown,
): AllMarketSettings {
  const defaults = createDefaultAllMarketSettings()
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return defaults
  }

  const raw = input as Partial<Record<LocationId, Partial<MarketSettings>>>
  return migrateLegacyUsdMarketRates({
    ghana: sanitizeMarketSettings('ghana', raw.ghana),
    nigeria: sanitizeMarketSettings('nigeria', raw.nigeria),
    usa: sanitizeMarketSettings('usa', raw.usa),
    international: sanitizeMarketSettings('international', raw.international),
  })
}

/**
 * Bump USA / International fallback rates still stuck on the old 0.064 default.
 * Only used when custom rate is off (live FX) or as the saved fallback value.
 */
export function migrateLegacyUsdMarketRates(
  markets: AllMarketSettings,
): AllMarketSettings {
  const bump = (market: MarketSettings): MarketSettings => {
    if (Math.abs(market.exchangeRate - LEGACY_USD_PER_GHS) > 1e-9) return market
    return { ...market, exchangeRate: DEFAULT_USD_PER_GHS }
  }
  return {
    ...markets,
    usa: bump(markets.usa),
    international: bump(markets.international),
  }
}

export function usesLiveDhlRates(locationId: LocationId): boolean {
  return locationId === 'usa' || locationId === 'international'
}

export function applyMarketShipping(
  promotions: StorePromotions,
  market: Pick<
    MarketSettings,
    | 'locationId'
    | 'freeShippingEnabled'
    | 'freeShippingThreshold'
    | 'shippingFee'
  >,
): StorePromotions {
  if (usesLiveDhlRates(market.locationId)) {
    return {
      ...promotions,
      freeShippingEnabled: false,
      freeShippingThreshold: market.freeShippingThreshold,
      shippingFee: 0,
    }
  }

  return {
    ...promotions,
    freeShippingEnabled: market.freeShippingEnabled,
    freeShippingThreshold: market.freeShippingThreshold,
    shippingFee: market.shippingFee,
  }
}

export function isProductAvailableInMarket(
  productId: string,
  market: Pick<MarketSettings, 'restrictCatalog' | 'productIds'>,
): boolean {
  if (!market.restrictCatalog) return true
  return market.productIds.includes(productId)
}

export function assertMarketCartItems(
  items: { id: string }[],
  market: Pick<MarketSettings, 'restrictCatalog' | 'productIds' | 'locationId'>,
): void {
  if (items.length === 0) {
    throw new Error('Your cart is empty')
  }
  if (!market.restrictCatalog) return

  const invalid = items.filter(
    (item) => !market.productIds.includes(item.id),
  )
  if (invalid.length > 0) {
    throw new Error(
      'Some items in your cart are not available in this market. Remove them or switch region.',
    )
  }
}

/**
 * Fallback rates from market settings. Custom-enabled markets win when several
 * markets share a currency code (e.g. USA + International both use USD).
 */
export function marketRatesToCurrencyMap(
  markets: AllMarketSettings,
): Record<string, number> {
  const rates: Record<string, number> = { GHS: 1 }
  for (const market of Object.values(markets)) {
    const code = market.currencyCode.toUpperCase()
    if (rates[code] == null) rates[code] = market.exchangeRate
  }
  for (const market of Object.values(markets)) {
    if (!market.customExchangeRate) continue
    rates[market.currencyCode.toUpperCase()] = market.exchangeRate
  }
  return rates
}

/** Currencies an admin has locked to a custom rate (live FX must not overwrite). */
export function lockedMarketCurrencies(
  markets: AllMarketSettings,
): string[] {
  const locked = new Set<string>(['GHS'])
  for (const market of Object.values(markets)) {
    if (market.customExchangeRate) {
      locked.add(market.currencyCode.toUpperCase())
    }
  }
  return [...locked]
}

export function getEnabledLocationIds(
  markets: AllMarketSettings,
): LocationId[] {
  return (Object.keys(markets) as LocationId[]).filter(
    (id) => markets[id].enabled,
  )
}
