import { prisma } from '@/lib/prisma'
import { isDatabaseConfigured } from '@/lib/env'
import type { ProductBundle } from '@/lib/types/product-bundle'

/** Legacy demo bundle IDs auto-seeded on first load — removed from admin/catalog. */
const DEMO_BUNDLE_IDS = [
  'everyday-smile-duo',
  'strawberry-fresh-set',
  'whitening-power-kit',
] as const

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

async function uniqueBundleId(base: string): Promise<string> {
  const slug = base || 'bundle'
  let candidate = slug
  let suffix = 2

  while (true) {
    const existing = await prisma.productBundle.findUnique({
      where: { bundleId: candidate },
      select: { bundleId: true },
    })
    if (!existing) return candidate
    candidate = `${slug}-${suffix}`
    suffix += 1
  }
}

function toProductBundle(row: {
  bundleId: string
  name: string
  description: string
  image: string
  badge: string | null
  productIds: string[]
  price: number
  active: boolean
  sortOrder: number
}): ProductBundle {
  return {
    id: row.bundleId,
    name: row.name,
    description: row.description,
    image: row.image,
    badge: row.badge ?? undefined,
    productIds: row.productIds,
    price: row.price,
    active: row.active,
    sortOrder: row.sortOrder,
  }
}

/** One-time cleanup for bundles that were auto-seeded from demo data. */
export async function removeDemoProductBundles(): Promise<void> {
  if (!isDatabaseConfigured()) return

  try {
    await prisma.productBundle.deleteMany({
      where: { bundleId: { in: [...DEMO_BUNDLE_IDS] } },
    })
  } catch (error) {
    console.error('[removeDemoProductBundles]', error)
  }
}

export async function listProductBundles(options?: {
  activeOnly?: boolean
}): Promise<ProductBundle[]> {
  if (!isDatabaseConfigured()) {
    return []
  }

  try {
    await removeDemoProductBundles()

    const rows = await prisma.productBundle.findMany({
      where: options?.activeOnly ? { active: true } : undefined,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })

    return rows.map(toProductBundle)
  } catch (error) {
    console.error('[listProductBundles]', error)
    return []
  }
}

export async function getProductBundle(
  bundleId: string,
): Promise<ProductBundle | null> {
  if (!isDatabaseConfigured()) {
    return null
  }

  try {
    const row = await prisma.productBundle.findUnique({
      where: { bundleId },
    })
    return row ? toProductBundle(row) : null
  } catch (error) {
    console.error('[getProductBundle]', error)
    return null
  }
}

export async function createProductBundle(input: {
  name: string
  description?: string
  image?: string
  badge?: string | null
  productIds: string[]
  price?: number
  active?: boolean
  sortOrder?: number
}): Promise<ProductBundle> {
  if (!isDatabaseConfigured()) {
    throw new Error('DATABASE_NOT_CONFIGURED')
  }

  const bundleId = await uniqueBundleId(slugifyName(input.name))
  const uniqueProductIds = [...new Set(input.productIds.filter(Boolean))]

  const row = await prisma.productBundle.create({
    data: {
      bundleId,
      name: input.name.trim(),
      description: input.description?.trim() ?? '',
      image: input.image?.trim() ?? '',
      badge: input.badge?.trim() || null,
      productIds: uniqueProductIds,
      price: input.price ?? 0,
      active: input.active ?? true,
      sortOrder: input.sortOrder ?? 0,
    },
  })

  return toProductBundle(row)
}

export async function updateProductBundle(
  bundleId: string,
  input: {
    name?: string
    description?: string
    image?: string
    badge?: string | null
    productIds?: string[]
    price?: number
    active?: boolean
    sortOrder?: number
  },
): Promise<ProductBundle> {
  if (!isDatabaseConfigured()) {
    throw new Error('DATABASE_NOT_CONFIGURED')
  }

  const existing = await prisma.productBundle.findUnique({
    where: { bundleId },
  })
  if (!existing) {
    throw new Error('BUNDLE_NOT_FOUND')
  }

  const row = await prisma.productBundle.update({
    where: { bundleId },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.description !== undefined
        ? { description: input.description.trim() }
        : {}),
      ...(input.image !== undefined ? { image: input.image.trim() } : {}),
      ...(input.badge !== undefined
        ? { badge: input.badge?.trim() || null }
        : {}),
      ...(input.productIds !== undefined
        ? { productIds: [...new Set(input.productIds.filter(Boolean))] }
        : {}),
      ...(input.price !== undefined ? { price: input.price } : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
    },
  })

  return toProductBundle(row)
}

export async function reorderProductBundles(
  orderedBundleIds: string[],
): Promise<ProductBundle[]> {
  if (!isDatabaseConfigured()) {
    throw new Error('DATABASE_NOT_CONFIGURED')
  }

  const uniqueIds = [...new Set(orderedBundleIds.filter(Boolean))]
  if (uniqueIds.length === 0) {
    return listProductBundles({ activeOnly: false })
  }

  await prisma.$transaction(
    uniqueIds.map((bundleId, sortOrder) =>
      prisma.productBundle.update({
        where: { bundleId },
        data: { sortOrder },
      }),
    ),
  )

  return listProductBundles({ activeOnly: false })
}

export async function deleteProductBundle(bundleId: string): Promise<void> {
  if (!isDatabaseConfigured()) {
    throw new Error('DATABASE_NOT_CONFIGURED')
  }

  const existing = await prisma.productBundle.findUnique({
    where: { bundleId },
    select: { bundleId: true },
  })
  if (!existing) {
    throw new Error('BUNDLE_NOT_FOUND')
  }

  await prisma.productBundle.delete({ where: { bundleId } })
}
