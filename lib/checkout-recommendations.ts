import type { CartLineItem } from '@/components/cart-provider'
import {
  filterProductsByTag,
  orderProductsForTagCollection,
  productHasTag,
} from '@/lib/product-tags'
import type { Product } from '@/lib/types/product'

/**
 * Curated bundle upsells shown at checkout.
 * Each bundle adds the listed productIds that are not already in the cart.
 * Add real bundle SKUs here, or tag products with "bundle" in admin.
 */
export type CheckoutBundleOffer = {
  id: string
  title: string
  description: string
  productIds: string[]
  image: string
  badge?: string
}

export const checkoutBundleOffers: CheckoutBundleOffer[] = [
  {
    id: 'everyday-smile-duo',
    title: 'Everyday Smile Duo',
    description: 'Watermelon toothpaste + foaming mouthwash for a full daily routine.',
    productIds: ['1', '12'],
    image: '/gelos/watermelon2.jpeg',
    badge: 'Popular bundle',
  },
  {
    id: 'strawberry-fresh-set',
    title: 'Strawberry Fresh Set',
    description: 'Match your toothpaste and mouthwash for all-day strawberry freshness.',
    productIds: ['15', '20'],
    image: '/gelos/strawberry.jpeg',
    badge: 'Bundle & save',
  },
  {
    id: 'whitening-power-kit',
    title: 'Whitening Power Kit',
    description: 'LED whitening device with premium whitening strips.',
    productIds: ['10', '7'],
    image: '/gelos/led-whitening-device.png',
    badge: 'Best value',
  },
]

const COMPLEMENTARY_CATEGORIES: Record<string, string[]> = {
  Toothpaste: ['Mouthwash', 'Toothbrushes', 'Tongue Scraper', 'Whitening'],
  Mouthwash: ['Toothpaste', 'Tongue Scraper'],
  Whitening: ['Toothpaste', 'Mouthwash'],
  Toothbrushes: ['Toothpaste', 'Mouthwash'],
  'Tongue Scraper': ['Toothpaste', 'Mouthwash'],
  Wellness: ['Toothpaste', 'Mouthwash'],
}

function bundleFromProduct(product: Product): CheckoutBundleOffer {
  return {
    id: `catalog-bundle-${product.id}`,
    title: product.name,
    description: product.description,
    productIds: [product.id],
    image: product.image,
    badge: 'Bundle',
  }
}

/** Bundles to upsell — catalog bundle tags first, then curated sets not fully in cart. */
export function getCheckoutBundleUpsells(
  cartItems: CartLineItem[],
  products: Product[],
  bundleCollectionOrder?: string[] | null,
  limit = 3,
): CheckoutBundleOffer[] {
  const inCart = new Set(cartItems.map((item) => item.id))

  const catalogBundles = orderProductsForTagCollection(
    products,
    'bundle',
    bundleCollectionOrder,
  ).map(bundleFromProduct)

  const curated = checkoutBundleOffers.filter(
    (offer) => !offer.productIds.every((id) => inCart.has(id)),
  )

  const seen = new Set<string>()
  const merged: CheckoutBundleOffer[] = []

  for (const offer of [...catalogBundles, ...curated]) {
    if (seen.has(offer.id)) continue
    if (offer.productIds.every((id) => inCart.has(id))) continue
    seen.add(offer.id)
    merged.push(offer)
    if (merged.length >= limit) break
  }

  return merged
}

export function getMissingBundleProductIds(
  offer: CheckoutBundleOffer,
  cartItems: CartLineItem[],
): string[] {
  const inCart = new Set(cartItems.map((item) => item.id))
  return offer.productIds.filter((id) => !inCart.has(id))
}

export function getCheckoutCrossSells(
  cartItems: CartLineItem[],
  products: Product[],
  limit = 4,
): Product[] {
  if (cartItems.length === 0) return []

  const inCart = new Set(cartItems.map((item) => item.id))
  const cartCategories = new Set(
    cartItems
      .map((item) => products.find((product) => product.id === item.id)?.category)
      .filter((category): category is string => Boolean(category)),
  )

  const targetCategories = new Set<string>()
  for (const category of cartCategories) {
    for (const match of COMPLEMENTARY_CATEGORIES[category] ?? []) {
      targetCategories.add(match)
    }
  }

  const bundleIds = new Set(
    filterProductsByTag(products, 'bundle').map((product) => product.id),
  )

  const scored = products
    .filter((product) => !inCart.has(product.id) && !bundleIds.has(product.id))
    .map((product) => {
      let score = 0
      if (targetCategories.has(product.category)) score += 10
      if (productHasTag(product, 'best-seller')) score += 5
      if (productHasTag(product, 'new-arrival')) score += 2
      return { product, score }
    })
    .sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name))

  const complementary = scored
    .filter((entry) => entry.score > 0)
    .map((entry) => entry.product)

  if (complementary.length >= limit) {
    return complementary.slice(0, limit)
  }

  const filler = scored
    .filter((entry) => entry.score === 0)
    .map((entry) => entry.product)

  return [...complementary, ...filler].slice(0, limit)
}

export function sumProductPrices(
  productIds: string[],
  products: Product[],
): number {
  const byId = new Map(products.map((product) => [product.id, product]))
  return productIds.reduce(
    (sum, id) => sum + (byId.get(id)?.price ?? 0),
    0,
  )
}
