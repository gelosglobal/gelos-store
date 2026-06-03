import { prisma } from '@/lib/prisma'
import { isDatabaseConfigured } from '@/lib/env'
import { products as mockProducts } from '@/lib/mock-data'
import { getProductSlug } from '@/lib/product-utils'
import {
  getEffectiveProductTags,
  normalizeProductTags,
} from '@/lib/product-tags'
import { getEffectiveVariantImages } from '@/lib/product-variant-images'

/** Import or refresh the full mock catalog in MongoDB. */
export async function seedCatalog(): Promise<number> {
  if (!isDatabaseConfigured()) {
    throw new Error('DATABASE_NOT_CONFIGURED')
  }

  for (const product of mockProducts) {
    const image = product.image.startsWith('/')
      ? product.image
      : `/${product.image}`

    const tags = normalizeProductTags(
      getEffectiveProductTags({ id: product.id, tags: [] }),
    )
    const variantImages = getEffectiveVariantImages({ id: product.id })

    await prisma.product.upsert({
      where: { productId: product.id },
      create: {
        productId: product.id,
        slug: getProductSlug(product),
        name: product.name,
        category: product.category,
        price: product.price,
        rating: product.rating,
        reviews: product.reviews,
        image,
        description: product.description,
        stock: product.stock,
        tags,
        variantImages,
        galleryImages: [],
      },
      update: {
        slug: getProductSlug(product),
        name: product.name,
        category: product.category,
        price: product.price,
        rating: product.rating,
        reviews: product.reviews,
        image,
        description: product.description,
        stock: product.stock,
        tags,
        variantImages,
      },
    })
  }

  return mockProducts.length
}

/** Import mock catalog when the database is connected but empty. */
export async function seedCatalogIfEmpty(): Promise<boolean> {
  if (!isDatabaseConfigured()) return false

  const count = await prisma.product.count()
  if (count > 0) return false

  await seedCatalog()
  return true
}

export async function isCatalogPersisted(): Promise<boolean> {
  if (!isDatabaseConfigured()) return false
  try {
    return (await prisma.product.count()) > 0
  } catch {
    return false
  }
}
