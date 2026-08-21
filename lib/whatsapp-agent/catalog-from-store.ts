import { getAllProducts } from '@/lib/db/products'
import { getPublicAppUrl } from '@/lib/env'
import { isExternalImageUrl, normalizeImageUrl } from '@/lib/image-url'
import { collapseProductsIntoLineParents } from '@/lib/product-line-parents'
import { getProductSlug } from '@/lib/product-utils'
import type { WaCatalogProduct } from '@/lib/whatsapp-agent/types'
import type { Product } from '@/lib/types/product'

function stockStatus(stock: number | undefined): string {
  if (typeof stock !== 'number') return 'confirm'
  if (stock <= 0) return 'out_of_stock'
  return 'in_stock'
}

/** WhatsApp image messages require a public https URL. */
export function toPublicImageUrl(image: string | undefined | null): string | null {
  if (!image) return null
  const normalized = normalizeImageUrl(image)
  if (!normalized || normalized === '/placeholder.svg') return null
  if (isExternalImageUrl(normalized)) return normalized
  if (normalized.startsWith('/')) {
    return `${getPublicAppUrl()}${normalized}`
  }
  return null
}

function toWaProduct(product: Product): WaCatalogProduct {
  // Prefer storefront slug/handle so agent tools match catalog.json + PDP URLs
  // (e.g. flavored-toothpaste), not raw Prisma numeric ids.
  const id = (
    product.handle ||
    getProductSlug(product) ||
    product.id.replace(/^line:/, '')
  ).trim()

  const variants =
    product.variantImageOptions
      ?.map((option) => option.label?.trim())
      .filter((label): label is string => Boolean(label)) || []

  const uniqueVariants = [...new Set(variants)]
  const image =
    toPublicImageUrl(product.image) ||
    toPublicImageUrl(product.variantImageOptions?.[0]?.url)

  return {
    id,
    name: product.name,
    category: product.category,
    description: product.description?.slice(0, 280) || undefined,
    price_ghs: Number.isFinite(product.price) ? product.price : null,
    stock_status: stockStatus(product.stock),
    variants: uniqueVariants,
    image,
    active: product.active !== false,
  }
}

/**
 * Build the WhatsApp agent catalogue from the live storefront catalog
 * (Shopify/Prisma), collapsing flavour lines into parent + variants.
 * Falls back to empty array on failure — caller should use static JSON.
 */
export async function loadWhatsappCatalogFromStore(): Promise<WaCatalogProduct[]> {
  const products = await getAllProducts()
  const collapsed = collapseProductsIntoLineParents(products)
  const mapped = collapsed
    .filter((product) => product.active !== false)
    .map(toWaProduct)
    .filter((product) => Boolean(product.id && product.name))

  const seen = new Set<string>()
  const unique: WaCatalogProduct[] = []
  for (const product of mapped) {
    if (seen.has(product.id)) continue
    seen.add(product.id)
    unique.push(product)
  }
  return unique
}
