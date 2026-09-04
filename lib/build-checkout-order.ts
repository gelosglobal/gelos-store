import { z } from 'zod'
import { calculateCheckoutTotals } from '@/lib/checkout'
import { localizeCheckoutTotals } from '@/lib/dhl/prices'
import {
  convertFromBase,
  getPaystackCurrencyForLocation,
  hasExchangeRate,
  setLiveUsdToLocalRates,
  setRuntimeExchangeRates,
} from '@/lib/exchange-rates'
import { currencyForCountry } from '@/lib/country-currency'
import { fetchUsdToLocalRates } from '@/lib/fx-live'
import { getAllProducts } from '@/lib/db/products'
import { getStorePromotions } from '@/lib/db/store-settings'
import {
  getAllMarketSettings,
  getMarketSettings,
} from '@/lib/db/market-settings'
import {
  applyMarketShipping,
  assertMarketCartItems,
  marketRatesToCurrencyMap,
  usesLiveDhlRates,
} from '@/lib/market-settings'
import { findAffiliateByCode } from '@/lib/db/affiliates'
import { calculateAffiliateCommission } from '@/lib/affiliates'
import { findActivePromo } from '@/lib/store-promotions'
import type { LocationId } from '@/lib/locations'
import { getCartDisplayName } from '@/lib/variant-display'
import { isDhlConfigured } from '@/lib/dhl/config'
import { fetchDhlRates } from '@/lib/dhl/rates'
import type { DhlRateOption } from '@/lib/dhl/types'
import { countryCodeFromLocation } from '@/lib/shipping-destination'

export const checkoutLineItemSchema = z.object({
  id: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
  variantImage: z.string().optional(),
  variantLabel: z.string().optional(),
})

export const checkoutShippingSchema = z.object({
  countryCode: z.string().trim().length(2),
  city: z.string().trim().min(2).max(80),
  postalCode: z
    .string()
    .trim()
    .max(20)
    .optional()
    .transform((value) => value || undefined),
  addressLine1: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((value) => (value && value.length >= 3 ? value : undefined)),
  productCode: z
    .string()
    .trim()
    .max(10)
    .optional()
    .transform((value) => value || undefined),
})

export const checkoutRequestSchema = z.object({
  visitorId: z.string().min(8).max(120).optional(),
  email: z.string().email(),
  name: z.string().min(2).max(120),
  phone: z.string().max(30).optional(),
  shippingAddress: z.string().max(300).optional(),
  shipping: checkoutShippingSchema.optional(),
  locationId: z.enum(['international', 'nigeria', 'ghana', 'usa']),
  currencyCode: z
    .string()
    .trim()
    .length(3)
    .optional()
    .transform((value) => value?.toUpperCase()),
  items: z.array(checkoutLineItemSchema).min(1),
  promoCode: z.string().max(40).optional(),
  affiliateCode: z.string().max(40).optional(),
  smileRewardFreeShipping: z.boolean().optional(),
  /** @deprecated Use promoCode */
  promoApplied: z.boolean().optional(),
})

export type CheckoutRequestBody = z.infer<typeof checkoutRequestSchema>

function resolveCheckoutCurrency(
  locationId: LocationId,
  marketCurrency: string,
  requested?: string,
  shippingCountry?: string,
): string {
  if (locationId === 'ghana') return 'GHS'
  if (locationId === 'usa') return marketCurrency || 'USD'
  if (locationId === 'nigeria') return marketCurrency || 'NGN'

  const requestedCode = requested?.trim().toUpperCase()
  if (requestedCode && hasExchangeRate(requestedCode)) return requestedCode

  const fromShipping = shippingCountry
    ? currencyForCountry(shippingCountry)
    : undefined
  if (fromShipping && hasExchangeRate(fromShipping)) return fromShipping

  return marketCurrency || 'USD'
}

function resolveDestinationCountry(
  locationId: LocationId,
  shippingCountry?: string,
): string | undefined {
  const fromMarket = countryCodeFromLocation(locationId)
  if (fromMarket) return fromMarket
  const code = shippingCountry?.trim().toUpperCase()
  return code && code.length === 2 ? code : undefined
}

export async function buildLocalizedCheckoutOrder(body: CheckoutRequestBody) {
  const locationId = body.locationId as LocationId
  const markets = await getAllMarketSettings()
  const market = markets[locationId] ?? (await getMarketSettings(locationId))
  const usdToLocal = await fetchUsdToLocalRates()
  setLiveUsdToLocalRates(usdToLocal)
  setRuntimeExchangeRates(marketRatesToCurrencyMap(markets))

  assertMarketCartItems(body.items, market)

  const products = await getAllProducts()
  const productMap = new Map(products.map((product) => [product.id, product]))

  const checkoutItems = body.items.map((item) => {
    const product = productMap.get(item.id)
    if (!product) {
      throw new Error(`Product not found: ${item.id}`)
    }
    const variantLabel = item.variantLabel?.trim()
    return {
      id: product.id,
      name: getCartDisplayName(product.name, variantLabel),
      productName: product.name,
      price: product.price,
      quantity: item.quantity,
      variantLabel,
      variantImage: item.variantImage?.trim(),
    }
  })

  const currency = resolveCheckoutCurrency(
    locationId,
    market.currencyCode || getPaystackCurrencyForLocation(locationId),
    body.currencyCode,
    body.shipping?.countryCode,
  )

  const localizedItems = checkoutItems.map((item) => ({
    ...item,
    price: convertFromBase(item.price, currency),
  }))
  const storePromotions = await getStorePromotions()
  const promotions = applyMarketShipping(storePromotions, market)
  const promoCode =
    body.promoCode?.trim() ||
    (body.promoApplied
      ? promotions.promos.find((p) => p.enabled)?.code
      : undefined)

  if (promoCode && !findActivePromo(promoCode, promotions.promos)) {
    throw new Error('Invalid or expired promo code')
  }

  const affiliateCode = body.affiliateCode?.trim()
  const affiliate = affiliateCode
    ? await findAffiliateByCode(affiliateCode)
    : null

  if (affiliateCode && !affiliate) {
    throw new Error('Invalid or inactive affiliate code')
  }

  let shippingOverride: number | undefined
  let dhl: DhlRateOption | undefined

  const destinationCountry = resolveDestinationCountry(
    locationId,
    body.shipping?.countryCode,
  )
  const destinationCity = body.shipping?.city?.trim()
  const requiresDhl = usesLiveDhlRates(locationId)

  if (requiresDhl) {
    if (!isDhlConfigured()) {
      throw new Error('DHL shipping is not available. Please try again later.')
    }
    if (!destinationCountry || !destinationCity) {
      throw new Error('Enter your city so we can calculate DHL shipping.')
    }
    const itemCount = checkoutItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    )
    const rates = await fetchDhlRates({
      destinationCountryCode: destinationCountry,
      destinationCityName: destinationCity,
      destinationPostalCode: body.shipping?.postalCode,
      destinationAddressLine1: body.shipping?.addressLine1,
      itemCount,
      productCode: body.shipping?.productCode,
    })
    shippingOverride = rates.selected.totalPriceBase
    dhl = rates.selected
  }

  // Product totals use catalog FX. DHL shipping uses DHL billed/local prices.
  const baseTotals = calculateCheckoutTotals(checkoutItems, {
    promoCode,
    promotions,
    smileRewardFreeShipping: body.smileRewardFreeShipping === true,
    shippingOverride,
  })
  const totals = localizeCheckoutTotals(baseTotals, currency, dhl)

  if (totals.total <= 0) {
    throw new Error('Invalid order total')
  }

  return {
    locationId,
    market,
    checkoutItems,
    localizedItems,
    baseTotals,
    totals,
    currency,
    promoCode: promoCode || undefined,
    dhl,
    affiliate: affiliate
      ? {
          affiliateId: affiliate.affiliateId,
          code: affiliate.code,
          name: affiliate.name,
          commissionPercent: affiliate.commissionPercent,
          commissionAmount: calculateAffiliateCommission(
            totals.total,
            affiliate.commissionPercent,
          ),
        }
      : null,
  }
}
