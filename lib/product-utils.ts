import type { Product } from '@/lib/types/product'

/** URL-safe slug from product name, e.g. "Watermelon Toothpaste" → "watermelon-toothpaste" */
export function getProductSlug(product: Pick<Product, 'name'>): string {
  return product.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/** Canonical product page path — one page per product */
export function getProductHref(product: Pick<Product, 'id' | 'name'>): string {
  return `/product/${getProductSlug(product)}`
}
