import { bestSellerIds } from '@/lib/best-seller-meta'
import { newArrivalProductIds } from '@/lib/new-arrivals'
import type { Product } from '@/lib/types/product'

export const productTagDefinitions = [
  {
    id: 'best-seller',
    label: 'Best seller',
    description: 'Shown in the homepage best sellers carousel and shop filters.',
    badge: 'Best seller' as const,
  },
  {
    id: 'new-arrival',
    label: 'New arrival',
    description: 'Appears on New arrivals pages and shows a NEW badge.',
    badge: 'NEW' as const,
  },
  {
    id: 'featured',
    label: 'Featured',
    description: 'Highlight on the homepage featured section.',
  },
  {
    id: 'bundle',
    label: 'Bundle',
    description: 'Included when shoppers browse bundle collections.',
  },
] as const

export type ProductTagId = (typeof productTagDefinitions)[number]['id']

const legacyBestSellerIds = new Set<string>(bestSellerIds)
const legacyNewArrivalIds = new Set<string>(newArrivalProductIds)

const validTagIds = new Set<ProductTagId>(
  productTagDefinitions.map((t) => t.id),
)

export function normalizeProductTags(tags?: string[] | null): ProductTagId[] {
  if (!tags?.length) return []
  return tags.filter((t): t is ProductTagId => validTagIds.has(t as ProductTagId))
}

/** Stored tags only (from database / API). */
export function getStoredProductTags(
  product: Pick<Product, 'tags'>,
): ProductTagId[] {
  return normalizeProductTags(product.tags)
}

/** Storefront tags: stored values, or legacy ID lists when nothing saved yet. */
export function getEffectiveProductTags(
  product: Pick<Product, 'id' | 'tags'>,
): ProductTagId[] {
  const stored = getStoredProductTags(product)
  if (stored.length > 0) return stored

  const legacy: ProductTagId[] = []
  if (legacyBestSellerIds.has(product.id)) legacy.push('best-seller')
  if (legacyNewArrivalIds.has(product.id)) legacy.push('new-arrival')
  return legacy
}

export function productHasTag(
  product: Pick<Product, 'id' | 'tags'>,
  tag: ProductTagId,
): boolean {
  return getEffectiveProductTags(product).includes(tag)
}

export type ProductDisplayBadge = 'NEW' | 'Best seller'

export function getProductDisplayBadge(
  product: Pick<Product, 'id' | 'tags'>,
): ProductDisplayBadge | undefined {
  const tags = getEffectiveProductTags(product)
  if (tags.includes('new-arrival')) return 'NEW'
  if (tags.includes('best-seller')) return 'Best seller'
  return undefined
}

export function filterProductsByTag(
  products: Product[],
  tag: ProductTagId,
  /** Preserve order when using legacy ID lists */
  legacyOrder?: readonly string[],
): Product[] {
  const tagged = products.filter((p) => productHasTag(p, tag))
  if (tagged.some((p) => getStoredProductTags(p).length > 0)) {
    return tagged
  }
  if (!legacyOrder?.length) return tagged
  const order = new Map(legacyOrder.map((id, i) => [id, i]))
  return tagged.sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99))
}

/** Order and filter products for a tag collection (admin-curated list takes priority). */
export function orderProductsForTagCollection(
  products: Product[],
  tag: ProductTagId,
  collectionOrder?: string[] | null,
  legacyOrder?: readonly string[],
): Product[] {
  const order =
    collectionOrder && collectionOrder.length > 0
      ? collectionOrder
      : null

  if (order) {
    const byId = new Map(products.map((p) => [p.id, p]))
    return order
      .map((id) => byId.get(id))
      .filter((p): p is Product => Boolean(p))
  }

  return filterProductsByTag(products, tag, legacyOrder)
}

export function getTagDefinition(tagId: ProductTagId) {
  return productTagDefinitions.find((t) => t.id === tagId)
}
