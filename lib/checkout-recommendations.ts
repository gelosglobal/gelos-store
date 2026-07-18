import type { CartLineItem } from '@/components/cart-provider'
import {
  filterProductsByTag,
  productHasTag,
} from '@/lib/product-tags'
import type { Product } from '@/lib/types/product'
import type { ProductBundle } from '@/lib/types/product-bundle'
import {
  getBundleCatalogTotal,
  getResolvableBundleProductIds,
  resolveBundlePrice,
  sumProductPrices,
} from '@/lib/product-bundle-pricing'
import {
  hasVariantLevelInventory,
  sumVariantInventory,
} from '@/lib/product-variant-images'

/** True when the product (or any flavour/style) can be sold. */
export function isProductInStock(product: Product): boolean {
  if (hasVariantLevelInventory(product.variantImageOptions)) {
    return sumVariantInventory(product.variantImageOptions) > 0
  }
  return product.stock > 0
}

/**
 * Curated bundle upsells shown at checkout.
 * Each bundle adds the listed productIds that are not already in the cart.
 */
export type CheckoutBundleOffer = {
  id: string
  title: string
  description: string
  productIds: string[]
  image: string
  badge?: string
  /** 0 = sum of included product prices */
  price?: number
  /** Saved bundle IDs that no longer exist in the catalog */
  unavailableProductIds?: string[]
}

const COMPLEMENTARY_CATEGORIES: Record<string, string[]> = {
  Toothpaste: ['Mouthwash', 'Toothbrushes', 'Tongue Scraper', 'Whitening'],
  Mouthwash: ['Toothpaste', 'Tongue Scraper'],
  Whitening: ['Toothpaste', 'Mouthwash'],
  Toothbrushes: ['Toothpaste', 'Mouthwash'],
  'Tongue Scraper': ['Toothpaste', 'Mouthwash'],
  Wellness: ['Toothpaste', 'Mouthwash'],
}

export function productBundleToOffer(
  bundle: ProductBundle,
  products: Product[],
): CheckoutBundleOffer {
  const productIds = getResolvableBundleProductIds(bundle.productIds, products)
  const unavailableProductIds = bundle.productIds.filter(
    (id) => !productIds.includes(id),
  )
  const firstProduct = products.find((product) =>
    productIds.includes(product.id),
  )

  return {
    id: bundle.id,
    title: bundle.name,
    description: bundle.description,
    productIds,
    unavailableProductIds,
    image: bundle.image || firstProduct?.image || '/gelos/watermelon2.jpeg',
    badge: bundle.badge,
    price: bundle.price,
  }
}

export function getBundleOfferPrice(
  offer: CheckoutBundleOffer,
  products: Product[],
): number {
  return resolveBundlePrice(
    { price: offer.price ?? 0, productIds: offer.productIds },
    products,
  )
}

export function getBundleOfferCatalogTotal(
  offer: CheckoutBundleOffer,
  products: Product[],
): number {
  return getBundleCatalogTotal(offer.productIds, products)
}

/** Bundles to upsell — admin-defined bundles only. */
export function getCheckoutBundleUpsells(
  cartItems: CartLineItem[],
  products: Product[],
  productBundles: ProductBundle[] = [],
  limit = 3,
  options?: { showAll?: boolean },
): CheckoutBundleOffer[] {
  const inCart = new Set(cartItems.map((item) => item.id))

  const offers = productBundles
    .filter((bundle) => bundle.active && bundle.productIds.length > 0)
    .map((bundle) => productBundleToOffer(bundle, products))
    .filter((offer) => offer.productIds.length > 0)
    .filter(
      (offer) =>
        options?.showAll || !offer.productIds.every((id) => inCart.has(id)),
    )

  return options?.showAll ? offers : offers.slice(0, limit)
}

export function getMissingBundleProductIds(
  offer: CheckoutBundleOffer,
  cartItems: CartLineItem[],
  products: Product[],
): string[] {
  const resolvableIds = getResolvableBundleProductIds(
    offer.productIds,
    products,
  )
  const inCart = new Set(cartItems.map((item) => item.id))
  return resolvableIds.filter((id) => !inCart.has(id))
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
    .filter(
      (product) =>
        !inCart.has(product.id) &&
        !bundleIds.has(product.id) &&
        isProductInStock(product),
    )
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

export { sumProductPrices } from '@/lib/product-bundle-pricing'
