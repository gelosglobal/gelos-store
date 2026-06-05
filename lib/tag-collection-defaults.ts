import { bestSellerIds } from '@/lib/best-seller-meta'
import { featuredHeroProductIds } from '@/lib/featured-hero-meta'
import { newArrivalProductIds } from '@/lib/new-arrivals'
import type { ProductTagId } from '@/lib/product-tags'

/** Fallback order when nothing is saved in the database yet. */
export const defaultTagCollectionOrders: Partial<
  Record<ProductTagId, readonly string[]>
> = {
  'best-seller': bestSellerIds,
  'new-arrival': newArrivalProductIds,
  featured: featuredHeroProductIds,
}

export function getDefaultTagCollectionOrder(
  tagId: ProductTagId,
): string[] {
  return [...(defaultTagCollectionOrders[tagId] ?? [])]
}
