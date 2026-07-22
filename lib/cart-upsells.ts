import type { CartLineItem } from '@/components/cart-provider'
import type { CartUpsellSettings } from '@/lib/cart-upsell-settings'
import { DEFAULT_CART_UPSELL_SETTINGS } from '@/lib/cart-upsell-settings'
import {
  getCheckoutCrossSells,
  isProductInStock,
} from '@/lib/checkout-recommendations'
import { getAvailableStockForVariant } from '@/lib/product-variant-images'
import type { Product } from '@/lib/types/product'

export const CART_UPSELL_DISMISSED_KEY = 'gelos-dismissed-cart-upsells'

export type CartUpsellBadgeStyle = {
  background: string
  text: string
}

const QUANTITY_BADGE_STYLES: Record<2 | 3, CartUpsellBadgeStyle> = {
  2: { background: '#FFE566', text: '#171717' },
  3: { background: '#F97316', text: '#FFFFFF' },
}

const CROSS_SELL_BADGE_STYLE: CartUpsellBadgeStyle = {
  background: '#38BDF8',
  text: '#FFFFFF',
}

export type QuantityCartUpsellOffer = {
  kind: 'quantity'
  id: string
  lineKey: string
  productId: string
  productName: string
  targetQuantity: 2 | 3
  badge: string
  badgeStyle: CartUpsellBadgeStyle
  image: string
  offerTotal: number
  fullTotal: number
  savingsPercent: number
  disclaimer: string
}

export type CrossSellCartUpsellOffer = {
  kind: 'cross-sell'
  id: string
  productId: string
  productName: string
  badge: string
  badgeStyle: CartUpsellBadgeStyle
  image: string
  offerPrice: number
  regularPrice: number
  savingsPercent: number
  urgency: string
  disclaimer: string
}

export type CartUpsellOffer = QuantityCartUpsellOffer | CrossSellCartUpsellOffer

export function readDismissedCartUpsells(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = sessionStorage.getItem(CART_UPSELL_DISMISSED_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((id): id is string => typeof id === 'string'))
  } catch {
    return new Set()
  }
}

export function dismissCartUpsell(offerId: string): void {
  if (typeof window === 'undefined') return
  const dismissed = readDismissedCartUpsells()
  dismissed.add(offerId)
  sessionStorage.setItem(
    CART_UPSELL_DISMISSED_KEY,
    JSON.stringify([...dismissed]),
  )
}

function quantityOfferId(lineKey: string, targetQty: number): string {
  return `qty-${targetQty}-${lineKey}`
}

function crossSellOfferId(productId: string): string {
  return `cross-${productId}`
}

function isQuantityUpsellEligible(
  product: Product | undefined,
  settings: CartUpsellSettings,
): boolean {
  if (!product) return false
  if (settings.quantityProductIds.length > 0) {
    return settings.quantityProductIds.includes(product.id)
  }
  return settings.quantityCategories.includes(product.category)
}

function displayDiscountedTotal(fullTotal: number, discountPercent: number): number {
  return Math.round(fullTotal * (1 - discountPercent / 100) * 100) / 100
}

function getTierDiscount(settings: CartUpsellSettings, targetQty: 2 | 3): number {
  return targetQty === 2
    ? settings.tier2DiscountPercent
    : settings.tier3DiscountPercent
}

function getTierBadge(settings: CartUpsellSettings, targetQty: 2 | 3): string {
  return targetQty === 2 ? settings.tier2Badge : settings.tier3Badge
}

function getConfiguredCrossSells(
  cartItems: CartLineItem[],
  products: Product[],
  settings: CartUpsellSettings,
): Product[] {
  const inCart = new Set(cartItems.map((item) => item.id))
  const byId = new Map(products.map((product) => [product.id, product]))

  if (settings.crossSellProductIds.length > 0) {
    return settings.crossSellProductIds
      .map((id) => byId.get(id))
      .filter((product): product is Product => {
        if (!product) return false
        if (!isProductInStock(product)) return false
        return !inCart.has(product.id)
      })
  }

  return getCheckoutCrossSells(cartItems, products, 3)
}

/** Discounted per-unit price for a quantity-tier cart upsell. */
export function getQuantityUpsellUnitPrice(
  catalogUnitPrice: number,
  discountPercent: number,
): number {
  return displayDiscountedTotal(catalogUnitPrice, discountPercent)
}

function buildQuantityOffer(
  item: CartLineItem,
  catalogUnitPrice: number,
  targetQty: 2 | 3,
  settings: CartUpsellSettings,
): QuantityCartUpsellOffer {
  const savingsPercent = getTierDiscount(settings, targetQty)
  const fullTotal = catalogUnitPrice * targetQty
  const offerTotal = displayDiscountedTotal(fullTotal, savingsPercent)

  return {
    kind: 'quantity',
    id: quantityOfferId(item.lineKey, targetQty),
    lineKey: item.lineKey,
    productId: item.id,
    productName: item.name,
    targetQuantity: targetQty,
    badge: getTierBadge(settings, targetQty),
    badgeStyle: QUANTITY_BADGE_STYLES[targetQty],
    image: item.image,
    offerTotal,
    fullTotal,
    savingsPercent,
    disclaimer: `*Discount calculated on non-discounted retail price of ${targetQty} units.`,
  }
}

function buildCrossSellOffer(
  product: Product,
  settings: CartUpsellSettings,
): CrossSellCartUpsellOffer {
  const savingsPercent = settings.crossSellDiscountPercent
  const offerPrice = displayDiscountedTotal(product.price, savingsPercent)

  return {
    kind: 'cross-sell',
    id: crossSellOfferId(product.id),
    productId: product.id,
    productName: product.name,
    badge: settings.crossSellBadge,
    badgeStyle: CROSS_SELL_BADGE_STYLE,
    image: product.image,
    offerPrice,
    regularPrice: product.price,
    savingsPercent,
    urgency: settings.crossSellUrgency,
    disclaimer: `*Savings based on regular price of ${product.name}. Offer subject to cart eligibility and may change if cart is modified.`,
  }
}

/**
 * Returns one progressive upsell for the cart:
 * 1. Qty 1 on eligible item → upgrade to 2
 * 2. Qty 2 on eligible item → upgrade to 3
 * 3. Complementary product cross-sell
 */
export function getActiveCartUpsell(
  cartItems: CartLineItem[],
  products: Product[],
  dismissed: Set<string>,
  settings: CartUpsellSettings = DEFAULT_CART_UPSELL_SETTINGS,
): CartUpsellOffer | null {
  if (!settings.enabled || cartItems.length === 0) return null

  const productById = new Map(products.map((product) => [product.id, product]))
  const orderedItems = [...cartItems].reverse()

  for (const item of orderedItems) {
    const product = productById.get(item.id)
    if (!isQuantityUpsellEligible(product, settings)) continue
    if (!product || !isProductInStock(product)) continue

    const available = getAvailableStockForVariant(product, item.variantImage)

    if (item.quantity === 1) {
      const id = quantityOfferId(item.lineKey, 2)
      if (!dismissed.has(id) && 2 <= available) {
        return buildQuantityOffer(item, product.price, 2, settings)
      }
    }

    if (item.quantity === 2) {
      const id = quantityOfferId(item.lineKey, 3)
      if (!dismissed.has(id) && 3 <= available) {
        return buildQuantityOffer(item, product.price, 3, settings)
      }
    }
  }

  const crossSells = getConfiguredCrossSells(cartItems, products, settings)
  for (const product of crossSells) {
    const id = crossSellOfferId(product.id)
    if (!dismissed.has(id)) {
      return buildCrossSellOffer(product, settings)
    }
  }

  return null
}
