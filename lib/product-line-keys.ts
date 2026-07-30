import { getProductContentSlug } from '@/lib/product-content-slug'
import { getProductSlug } from '@/lib/product-utils'
import type { Product } from '@/lib/types/product'

export type ProductLineRef = Pick<Product, 'id' | 'name'> & {
  handle?: string
}

/**
 * Stable keys for flavour/style pickers: Shopify handle, content slug,
 * name slug, and legacy Prisma id (for local/mock catalogs).
 */
export function getProductLineKeys(product: ProductLineRef): string[] {
  const keys: string[] = []
  const seen = new Set<string>()

  const push = (value: string | undefined | null) => {
    const key = value?.trim().toLowerCase()
    if (!key || seen.has(key)) return
    seen.add(key)
    keys.push(key)
  }

  push(product.handle)
  push(getProductSlug(product))
  push(getProductContentSlug(product))
  push(product.id)

  return keys
}

/** Look up a cover/map value using any of the product's line keys. */
export function lookupByProductLineKey<T>(
  map: Record<string, T>,
  product: ProductLineRef,
): T | undefined {
  for (const key of getProductLineKeys(product)) {
    if (Object.prototype.hasOwnProperty.call(map, key)) {
      return map[key]
    }
  }
  return undefined
}

/** True when the product matches any key in the order/allow list. */
export function productMatchesLineKeys(
  product: ProductLineRef,
  keys: Iterable<string>,
): boolean {
  const allow = new Set(
    [...keys].map((key) => key.trim().toLowerCase()).filter(Boolean),
  )
  return getProductLineKeys(product).some((key) => allow.has(key))
}

/** Sort products by curated order (handles/slugs/ids); unknowns last, A–Z. */
export function sortProductsByLineOrder<T extends ProductLineRef>(
  products: T[],
  order: readonly string[],
): T[] {
  const orderIndex = new Map(
    order.map((key, index) => [key.trim().toLowerCase(), index]),
  )

  const indexFor = (product: T): number => {
    for (const key of getProductLineKeys(product)) {
      const index = orderIndex.get(key)
      if (index !== undefined) return index
    }
    return 1000
  }

  return [...products].sort((a, b) => {
    const diff = indexFor(a) - indexFor(b)
    if (diff !== 0) return diff
    return a.name.localeCompare(b.name)
  })
}

/** Keep only products that appear in the curated line order keys. */
export function filterProductsByLineOrder<T extends ProductLineRef>(
  products: T[],
  order: readonly string[],
): T[] {
  return products.filter((product) => productMatchesLineKeys(product, order))
}
