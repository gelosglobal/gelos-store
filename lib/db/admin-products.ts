import type { Product as PrismaProduct } from '@prisma/client'
import type { AdminProductInput } from '@/lib/admin/types'
import { getAllProducts } from '@/lib/db/products'
import { seedCatalogIfEmpty } from '@/lib/db/seed-catalog'
import { isDatabaseConfigured } from '@/lib/env'
import { prisma } from '@/lib/prisma'
import { getProductSlug } from '@/lib/product-utils'
import { normalizeImageUrl } from '@/lib/image-url'
import { normalizeProductTags } from '@/lib/product-tags'
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

function nextProductId(existingIds: string[]): string {
  const nums = existingIds
    .map((id) => parseInt(id, 10))
    .filter((n) => !Number.isNaN(n))
  const max = nums.length > 0 ? Math.max(...nums) : 0
  return String(max + 1)
}

export function isAdminDatabaseReady(): boolean {
  return isDatabaseConfigured()
}

/** Same catalog source as the storefront (`/api/products`). */
export async function listAdminProducts(): Promise<Product[]> {
  return getAllProducts()
}

export async function createAdminProduct(
  input: AdminProductInput,
): Promise<Product> {
  if (!isDatabaseConfigured()) {
    throw new Error('DATABASE_NOT_CONFIGURED')
  }

  await seedCatalogIfEmpty()

  const existing = await prisma.product.findMany({
    select: { productId: true },
  })
  const productId = nextProductId(existing.map((p) => p.productId))
  const slug = getProductSlug({ name: input.name })

  const doc = await prisma.product.create({
    data: {
      productId,
      slug,
      name: input.name.trim(),
      category: input.category,
      price: input.price,
      stock: input.stock,
      description: input.description.trim(),
      image: normalizeImageUrl(input.image.trim()),
      rating: input.rating ?? 4.8,
      reviews: input.reviews ?? 0,
      tags: normalizeProductTags(input.tags),
      variantImages: normalizeVariantImages(input.variantImages),
      galleryImages: normalizeGalleryImages(input.galleryImages),
    },
  })

  return prismaToProduct(doc)
}

export async function updateAdminProduct(
  productId: string,
  input: AdminProductInput,
): Promise<Product> {
  if (!isDatabaseConfigured()) {
    throw new Error('DATABASE_NOT_CONFIGURED')
  }

  await seedCatalogIfEmpty()

  const slug = getProductSlug({ name: input.name })
  const data = {
    slug,
    name: input.name.trim(),
    category: input.category,
    price: input.price,
    stock: input.stock,
    description: input.description.trim(),
    image: normalizeImageUrl(input.image.trim()),
    rating: input.rating ?? 4.8,
    reviews: input.reviews ?? 0,
    tags: normalizeProductTags(input.tags),
    variantImages: normalizeVariantImages(input.variantImages),
    galleryImages: normalizeGalleryImages(input.galleryImages),
  }

  const doc = await prisma.product.upsert({
    where: { productId },
    create: { productId, ...data },
    update: data,
  })

  return prismaToProduct(doc)
}

export async function deleteAdminProduct(productId: string): Promise<void> {
  if (!isDatabaseConfigured()) {
    throw new Error('DATABASE_NOT_CONFIGURED')
  }

  await seedCatalogIfEmpty()

  await prisma.product.delete({
    where: { productId },
  })
}

export async function getAdminDashboardStats(): Promise<{
  totalProducts: number
  lowStock: number
  categories: { name: string; count: number }[]
  toothpasteCount: number
  mouthwashCount: number
}> {
  const products = await listAdminProducts()
  const categoryMap = new Map<string, number>()

  for (const p of products) {
    categoryMap.set(p.category, (categoryMap.get(p.category) ?? 0) + 1)
  }

  return {
    totalProducts: products.length,
    lowStock: products.filter((p) => p.stock < 20).length,
    categories: [...categoryMap.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    toothpasteCount: products.filter((p) => p.category === 'Toothpaste').length,
    mouthwashCount: products.filter((p) => p.category === 'Mouthwash').length,
  }
}
