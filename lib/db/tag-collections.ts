import { prisma } from '@/lib/prisma'
import { isDatabaseConfigured } from '@/lib/env'
import {
  getDefaultTagCollectionOrder,
  defaultTagCollectionOrders,
} from '@/lib/tag-collection-defaults'
import {
  normalizeProductTags,
  productTagDefinitions,
  type ProductTagId,
} from '@/lib/product-tags'
import { isShopifyCatalogEnabled } from '@/lib/shopify/config'

const tagIds = productTagDefinitions.map((t) => t.id)

/** Shopify numeric product IDs — ignore when Gelos/Prisma catalog is active. */
function isShopifyProductIdList(ids: string[]): boolean {
  return ids.length > 0 && ids.every((id) => /^\d{10,}$/.test(id))
}

function usableProductIds(ids: string[] | undefined | null): string[] | null {
  if (!ids?.length) return null
  if (!isShopifyCatalogEnabled() && isShopifyProductIdList(ids)) return null
  return ids
}

export async function getTagCollectionOrder(
  tagId: ProductTagId,
): Promise<string[]> {
  if (!isDatabaseConfigured()) {
    return getDefaultTagCollectionOrder(tagId)
  }

  try {
    const doc = await prisma.tagCollection.findUnique({
      where: { tagId },
    })
    const usable = usableProductIds(doc?.productIds)
    if (usable) return usable
    return getDefaultTagCollectionOrder(tagId)
  } catch (error) {
    console.error('[getTagCollectionOrder]', error)
    return getDefaultTagCollectionOrder(tagId)
  }
}

export async function getAllTagCollectionOrders(): Promise<
  Record<ProductTagId, string[]>
> {
  const result = {} as Record<ProductTagId, string[]>

  if (!isDatabaseConfigured()) {
    for (const tagId of tagIds) {
      result[tagId] = getDefaultTagCollectionOrder(tagId)
    }
    return result
  }

  try {
    const docs = await prisma.tagCollection.findMany()
    const byTag = new Map(docs.map((d) => [d.tagId, d.productIds]))

    for (const tagId of tagIds) {
      const usable = usableProductIds(byTag.get(tagId))
      result[tagId] = usable ?? getDefaultTagCollectionOrder(tagId)
    }
    return result
  } catch (error) {
    console.error('[getAllTagCollectionOrders]', error)
    for (const tagId of tagIds) {
      result[tagId] = getDefaultTagCollectionOrder(tagId)
    }
    return result
  }
}

async function syncProductTagsForCollection(
  tagId: ProductTagId,
  productIds: string[],
) {
  const idSet = new Set(productIds)

  const tagged = await prisma.product.findMany({
    where: { tags: { has: tagId } },
    select: { productId: true, tags: true },
  })

  for (const productId of productIds) {
    const doc = await prisma.product.findUnique({
      where: { productId },
      select: { tags: true },
    })
    if (!doc) continue
    const tags = normalizeProductTags(doc.tags)
    if (!tags.includes(tagId)) {
      await prisma.product.update({
        where: { productId },
        data: { tags: [...tags, tagId] },
      })
    }
  }

  for (const row of tagged) {
    if (!idSet.has(row.productId)) {
      const tags = normalizeProductTags(row.tags).filter((t) => t !== tagId)
      await prisma.product.update({
        where: { productId: row.productId },
        data: { tags },
      })
    }
  }
}

export async function saveTagCollectionOrder(
  tagId: ProductTagId,
  productIds: string[],
): Promise<string[]> {
  if (!isDatabaseConfigured()) {
    throw new Error('DATABASE_NOT_CONFIGURED')
  }

  const uniqueIds = [...new Set(productIds.filter(Boolean))]

  await prisma.tagCollection.upsert({
    where: { tagId },
    create: { tagId, productIds: uniqueIds },
    update: { productIds: uniqueIds },
  })

  await syncProductTagsForCollection(tagId, uniqueIds)

  return uniqueIds
}

/** Seed empty tag collections from legacy default lists. */
export async function seedTagCollectionsIfEmpty(): Promise<void> {
  if (!isDatabaseConfigured()) return

  for (const tagId of tagIds) {
    const existing = await prisma.tagCollection.findUnique({
      where: { tagId },
    })
    if (existing?.productIds.length) continue

    const defaults = defaultTagCollectionOrders[tagId]
    if (!defaults?.length) continue

    await saveTagCollectionOrder(tagId, [...defaults])
  }
}
