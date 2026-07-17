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
  /**
   * @deprecated Totals are always computed in catalog base currency (GHS).
   * Location conversion happens at display / payment boundaries via formatPrice
   * or convertForLocation — do not pass locationId for conversion here.
   */
  locationId?: LocationId
  promotions?: StorePromotions
  smileRewardFreeShipping?: boolean
}

/**
 * Compute cart/checkout money in catalog base currency (GHS).
 * Pass results through formatPrice() or convertForLocation() for display/payment.
 */
export function calculateCheckoutTotals(
  items: CheckoutLineItem[],
  options: CalculateCheckoutTotalsOptions = {},
): CheckoutTotals {
  const promotions = options.promotions ?? DEFAULT_STORE_PROMOTIONS
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  )
  const discount = calculatePromoDiscount(
    subtotal,
    options.promoCode,
    promotions.promos,
  )
  const afterDiscount = subtotal - discount

  const shipping =
    items.length === 0
      ? 0
      : options.smileRewardFreeShipping
        ? 0
        : !promotions.freeShippingEnabled
          ? promotions.shippingFee
          : afterDiscount >= promotions.freeShippingThreshold
            ? 0
            : promotions.shippingFee

  return {
    subtotal,
    discount,
    shipping,
    total: afterDiscount + shipping,
  }
}

export function getCurrencyForLocation(locationId: LocationId): string {
  return getLocationById(locationId)?.currencyCode ?? 'GHS'
}
