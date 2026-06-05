import type { CartEntry } from '@/lib/cart-types'

export function getCartLineKey(entry: Pick<CartEntry, 'productId' | 'variantImage'>): string {
  if (entry.variantImage?.trim()) {
    return `${entry.productId}::${entry.variantImage.trim()}`
  }
  return entry.productId
}
