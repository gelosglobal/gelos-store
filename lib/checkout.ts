import { convertForLocation } from '@/lib/exchange-rates'
import type { LocationId } from '@/lib/locations'
import { getLocationById } from '@/lib/locations'
import {
  calculatePromoDiscount,
  DEFAULT_STORE_PROMOTIONS,
  type StorePromotions,
} from '@/lib/store-promotions'

export type CheckoutLineItem = {
  id: string
  name: string
  price: number
  quantity: number
  variantLabel?: string
  variantImage?: string
  productName?: string
}

export type CheckoutTotals = {
  subtotal: number
  discount: number
  shipping: number
  total: number
}

export type CalculateCheckoutTotalsOptions = {
  promoCode?: string
  locationId?: LocationId
  promotions?: StorePromotions
}

function localizeLineItems(
  items: CheckoutLineItem[],
  locationId?: LocationId,
): CheckoutLineItem[] {
  if (!locationId) return items
  return items.map((item) => ({
    ...item,
    price: convertForLocation(item.price, locationId),
  }))
}

export function calculateCheckoutTotals(
  items: CheckoutLineItem[],
  options: CalculateCheckoutTotalsOptions = {},
): CheckoutTotals {
  const promotions = options.promotions ?? DEFAULT_STORE_PROMOTIONS
  const locationId = options.locationId
  const localizedItems = localizeLineItems(items, locationId)
  const subtotal = localizedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  )
  const discount = calculatePromoDiscount(
    subtotal,
    options.promoCode,
    promotions.promos,
  )
  const afterDiscount = subtotal - discount

  const freeShippingThreshold = locationId
    ? convertForLocation(promotions.freeShippingThreshold, locationId)
    : promotions.freeShippingThreshold
  const shippingFee = locationId
    ? convertForLocation(promotions.shippingFee, locationId)
    : promotions.shippingFee

  const shipping =
    localizedItems.length === 0
      ? 0
      : !promotions.freeShippingEnabled
        ? shippingFee
        : afterDiscount >= freeShippingThreshold
          ? 0
          : shippingFee
  const total = afterDiscount + shipping

  return { subtotal, discount, shipping, total }
}

export function getCurrencyForLocation(locationId: LocationId): string {
  return getLocationById(locationId)?.currencyCode ?? 'GHS'
}
