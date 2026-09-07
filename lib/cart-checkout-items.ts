import type { CartLineItem } from '@/components/cart-provider'
import { getBundleLineUnitPrice } from '@/lib/product-bundle-pricing'
import type { Product } from '@/lib/types/product'

/** Payload for Shopify / Gelos checkout APIs. */
export function toShopifyCheckoutItem(item: CartLineItem) {
  return {
    id: item.id,
    quantity: item.quantity,
    price: item.price,
    variantImage: item.variantImage,
    variantLabel: item.variantLabel,
    bundleId: item.bundleId,
    bundleName: item.bundleId ? item.name : undefined,
    bundleImage: item.bundleId ? item.image : undefined,
    bundleComponents: item.bundleComponents,
  }
}

/**
 * Expand bundle cart rows into component products for Gelos/Paystack orders
 * (Shopify keeps the single bundle line instead).
 */
export function expandCartItemsForNativeCheckout(
  items: CartLineItem[],
  products: Product[],
): CartLineItem[] {
  const expanded: CartLineItem[] = []

  for (const item of items) {
    if (!item.bundleId || !item.bundleComponents?.length) {
      expanded.push(item)
      continue
    }

    const componentIds = item.bundleComponents.map((c) => c.productId)
    for (const component of item.bundleComponents) {
      const product = products.find((p) => p.id === component.productId)
      if (!product) continue
      const unitPrice = getBundleLineUnitPrice(
        component.productId,
        item.price,
        componentIds,
        products,
      )
      expanded.push({
        lineKey: `${item.lineKey}::${component.productId}`,
        id: component.productId,
        productName: product.name,
        name: product.name,
        variantLabel: component.variantLabel,
        variantImage: component.variantImage,
        price: unitPrice ?? product.price,
        image: component.variantImage || product.image,
        quantity: item.quantity,
      })
    }
  }

  return expanded
}
