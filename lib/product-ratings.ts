import { products as mockProducts } from '@/lib/mock-data'
import { getProductContentSlug } from '@/lib/product-content-slug'
import { getProductSlug } from '@/lib/product-utils'
import type { Product } from '@/lib/types/product'

export type ProductRatings = {
  rating: number
  reviews: number
}

const DEFAULT_RATINGS: ProductRatings = {
  rating: 4.8,
  reviews: 0,
}

function buildRatingsBySlug(): Map<string, ProductRatings> {
  const map = new Map<string, ProductRatings>()
  for (const product of mockProducts) {
    const slug = getProductSlug({ name: product.name })
    map.set(slug, {
      rating: product.rating,
      reviews: product.reviews,
    })
  }
  return map
}

const ratingsBySlug = buildRatingsBySlug()

/**
 * Resolve star rating + review count for a product.
 * Prefers Gelos catalog (mock) via content-slug aliases, then existing product fields.
 */
export function resolveProductRatings(
  product: Pick<Product, 'name' | 'rating' | 'reviews'> & { handle?: string },
): ProductRatings {
  const contentSlug = getProductContentSlug(product)
  const nameSlug = getProductSlug(product)
  const handle = product.handle?.trim().toLowerCase()

  const fromCatalog =
    ratingsBySlug.get(contentSlug) ||
    ratingsBySlug.get(nameSlug) ||
    (handle ? ratingsBySlug.get(handle) : undefined)

  if (fromCatalog) return fromCatalog

  if (
    Number.isFinite(product.reviews) &&
    product.reviews > 0 &&
    Number.isFinite(product.rating)
  ) {
    return {
      rating: clampRating(product.rating),
      reviews: Math.max(0, Math.round(product.reviews)),
    }
  }

  return DEFAULT_RATINGS
}

export function clampRating(rating: number): number {
  if (!Number.isFinite(rating)) return DEFAULT_RATINGS.rating
  return Math.min(5, Math.max(0, Math.round(rating * 10) / 10))
}

export function normalizeReviewsCount(reviews: number): number {
  if (!Number.isFinite(reviews)) return 0
  return Math.max(0, Math.round(reviews))
}
