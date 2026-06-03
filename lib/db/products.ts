import type { Product as PrismaProduct } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { isDatabaseConfigured } from '@/lib/env'
import { products as mockProducts } from '@/lib/mock-data'
import { getProductSlug } from '@/lib/product-utils'
import { normalizeProductTags } from '@/lib/product-tags'
import { normalizeImageUrl } from '@/lib/image-url'
import { normalizeGalleryImages } from '@/lib/product-gallery-images'
import { normalizeVariantImages } from '@/lib/product-variant-images'
import type { Product } from '@/lib/types/product'

function prismaToProduct(doc: PrismaProduct): Product {
  return {
    id: doc.productId,
    name: doc.name,
    category: doc.category,
    price: doc.price,
    rating: doc.rating,
    reviews: doc.reviews,
    image: normalizeImageUrl(doc.image),
    description: doc.description,
    stock: doc.stock,
    tags: normalizeProductTags(doc.tags),
    variantImages: normalizeVariantImages(doc.variantImages),
    galleryImages: normalizeGalleryImages(doc.galleryImages),
  }
}

function mockFallback(): Product[] {
  return mockProducts.map((p) => ({
    ...p,
    image: normalizeImageUrl(p.image),
    tags: [],
    variantImages: [],
    galleryImages: [],
  }))
}

export async function getAllProducts(): Promise<Product[]> {
  if (!isDatabaseConfigured()) {
    return mockFallback()
  }

  try {
    const docs = await prisma.product.findMany({
      orderBy: { productId: 'asc' },
    })
    if (docs.length === 0) return mockFallback()
    return docs.map(prismaToProduct)
  } catch (error) {
    console.error('[getAllProducts]', error)
    return mockFallback()
  }
}

export async function getProductBySlugOrId(
  slugOrId: string,
): Promise<Product | null> {
  if (!isDatabaseConfigured()) {
    const found = mockProducts.find(
      (p) => p.id === slugOrId || getProductSlug(p) === slugOrId,
    )
    if (!found) return null
    return {
      ...found,
      image: normalizeImageUrl(found.image),
      tags: [],
      variantImages: [],
    galleryImages: [],
    }
  }

  try {
    const doc = await prisma.product.findFirst({
      where: {
        OR: [{ productId: slugOrId }, { slug: slugOrId }],
      },
    })

    if (!doc) {
      const found = mockProducts.find(
        (p) => p.id === slugOrId || getProductSlug(p) === slugOrId,
      )
      if (!found) return null
      return {
        ...found,
        image: normalizeImageUrl(found.image),
        tags: [],
        variantImages: [],
    galleryImages: [],
      }
    }

    return prismaToProduct(doc)
  } catch (error) {
    console.error('[getProductBySlugOrId]', error)
    return null
  }
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  const all = await getAllProducts()
  const byId = new Map(all.map((p) => [p.id, p]))
  return ids.map((id) => byId.get(id)).filter((p): p is Product => Boolean(p))
}

export async function getToothpasteVariants(): Promise<Product[]> {
  const all = await getAllProducts()
  return all.filter((p) => p.category === 'Toothpaste')
}

export async function getMouthwashVariants(): Promise<Product[]> {
  const all = await getAllProducts()
  return all.filter((p) => p.category === 'Mouthwash')
}

export async function getTongueScraperVariants(): Promise<Product[]> {
  const all = await getAllProducts()
  return all.filter((p) => p.category === 'Tongue Scraper')
}

export async function getWellnessVariants(): Promise<Product[]> {
  const all = await getAllProducts()
  return all.filter((p) => p.category === 'Wellness')
}

export async function getWhiteningVariants(): Promise<Product[]> {
  const all = await getAllProducts()
  return all.filter((p) => p.category === 'Whitening')
}

export async function getToothbrushVariants(): Promise<Product[]> {
  const all = await getAllProducts()
  return all.filter((p) => p.category === 'Toothbrushes')
}

export async function getRelatedProducts(
  product: Product,
  limit = 4,
): Promise<Product[]> {
  if (!isDatabaseConfigured()) {
    return mockProducts
      .filter((p) => p.category === product.category && p.id !== product.id)
      .slice(0, limit)
      .map((p) => ({
        ...p,
        image: normalizeImageUrl(p.image),
    tags: [],
    variantImages: [],
    galleryImages: [],
  }))
}

  try {
    const docs = await prisma.product.findMany({
      where: {
        category: product.category,
        productId: { not: product.id },
      },
      take: limit,
    })
    return docs.map(prismaToProduct)
  } catch (error) {
    console.error('[getRelatedProducts]', error)
    return []
  }
}

export async function getAllProductSlugs(): Promise<string[]> {
  const list = await getAllProducts()
  return list.map((p) => getProductSlug(p))
}
