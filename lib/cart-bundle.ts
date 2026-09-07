import type { CartEntry } from '@/lib/cart-types'

export const CART_BUNDLE_ID_PREFIX = 'bundle:'

export type CartBundleComponent = {
  productId: string
  variantImage?: string
  variantLabel?: string
}

export function cartBundleProductId(bundleId: string): string {
  return `${CART_BUNDLE_ID_PREFIX}${bundleId}`
}

export function isCartBundleProductId(productId: string): boolean {
  return productId.startsWith(CART_BUNDLE_ID_PREFIX)
}

export function parseCartBundleId(productId: string): string | null {
  if (!isCartBundleProductId(productId)) return null
  const id = productId.slice(CART_BUNDLE_ID_PREFIX.length).trim()
  return id || null
}

export function isCartBundleEntry(
  entry: Pick<CartEntry, 'bundleId' | 'productId'>,
): boolean {
  return Boolean(entry.bundleId) || isCartBundleProductId(entry.productId)
}
