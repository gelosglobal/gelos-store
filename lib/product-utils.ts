import type { Product } from '@/lib/types/product'

/** URL-safe slug from product name, e.g. "Watermelon Toothpaste" → "watermelon-toothpaste" */
export function getProductSlug(
  product: Pick<Product, 'name'> & { handle?: string },
): string {
  if (product.handle?.trim()) {
    return product.handle.trim().toLowerCase()
  }
  return product.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/** Canonical product page path — one page per product */
export function getProductHref(
  product: Pick<Product, 'id' | 'name'> & { handle?: string },
): string {
  return `/product/${getProductSlug(product)}`
}

/** Published on the storefront unless explicitly drafted. */
export function isProductPublished(product: Pick<Product, 'active'>): boolean {
  return product.active !== false
}
