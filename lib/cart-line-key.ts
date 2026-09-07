import type { CartEntry } from '@/lib/cart-types'
import { isCartBundleEntry } from '@/lib/cart-bundle'

export function getCartLineKey(
  entry: Pick<
    CartEntry,
    'productId' | 'variantImage' | 'unitPrice' | 'bundleId'
  >,
): string {
  if (isCartBundleEntry(entry)) {
    const bundleKey = entry.bundleId
      ? `bundle:${entry.bundleId}`
      : entry.productId
    if (entry.unitPrice !== undefined && entry.unitPrice >= 0) {
      return `${bundleKey}::${entry.unitPrice.toFixed(2)}`
    }
    return bundleKey
  }

  const base = entry.variantImage?.trim()
    ? `${entry.productId}::${entry.variantImage.trim()}`
    : entry.productId

  if (entry.unitPrice !== undefined && entry.unitPrice >= 0) {
    return `${base}::${entry.unitPrice.toFixed(2)}`
  }

  return base
}
