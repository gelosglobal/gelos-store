import type { CartEntry } from '@/lib/cart-types'

export function getCartLineKey(
  entry: Pick<CartEntry, 'productId' | 'variantImage' | 'unitPrice'>,
): string {
  const base = entry.variantImage?.trim()
    ? `${entry.productId}::${entry.variantImage.trim()}`
    : entry.productId

  if (entry.unitPrice !== undefined && entry.unitPrice >= 0) {
    return `${base}::${entry.unitPrice.toFixed(2)}`
  }

  return base
}
