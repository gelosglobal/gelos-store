import type { LocationId } from '@/lib/locations'
import { locations } from '@/lib/locations'
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
  usa: 0.064,
  international: 0.064,
}

function defaultPayments(locationId: LocationId): MarketPayments {
  if (locationId === 'usa') {
    return { paystack: false, stripe: true, cod: false }
  }
  return { paystack: true, stripe: false, cod: true }
}

function defaultPaymentMethod(locationId: LocationId): MarketPaymentMethod {
  return locationId === 'usa' ? 'stripe' : 'paystack'
}

export function createDefaultMarketSettings(
  locationId: LocationId,
): MarketSettings {
  const location = locations.find((loc) => loc.id === locationId)
  return {
    locationId,
    enabled: true,
    currencyCode: location?.currencyCode ?? 'GHS',
    exchangeRate: DEFAULT_RATES[locationId],
    freeShippingEnabled: true,
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
    stripe: asBool(raw.stripe, fallback.stripe),
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
  return {
    ghana: sanitizeMarketSettings('ghana', raw.ghana),
    nigeria: sanitizeMarketSettings('nigeria', raw.nigeria),
    usa: sanitizeMarketSettings('usa', raw.usa),
    international: sanitizeMarketSettings('international', raw.international),
  }
}

export function applyMarketShipping(
  promotions: StorePromotions,
  market: Pick<
    MarketSettings,
    'freeShippingEnabled' | 'freeShippingThreshold' | 'shippingFee'
  >,
): StorePromotions {
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

export function marketRatesToCurrencyMap(
  markets: AllMarketSettings,
): Record<string, number> {
  const rates: Record<string, number> = { GHS: 1 }
  for (const market of Object.values(markets)) {
    rates[market.currencyCode.toUpperCase()] = market.exchangeRate
  }
  return rates
}

export function getEnabledLocationIds(
  markets: AllMarketSettings,
): LocationId[] {
  return (Object.keys(markets) as LocationId[]).filter(
    (id) => markets[id].enabled,
  )
}
