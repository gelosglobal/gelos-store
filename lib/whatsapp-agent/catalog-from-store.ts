import { getAllProducts } from '@/lib/db/products'
import { collapseProductsIntoLineParents } from '@/lib/product-line-parents'
import type { WaCatalogProduct } from '@/lib/whatsapp-agent/types'
import type { Product } from '@/lib/types/product'

function stockStatus(stock: number | undefined): string {
  if (typeof stock !== 'number') return 'confirm'
  if (stock <= 0) return 'out_of_stock'
  return 'in_stock'
}

function toWaProduct(product: Product): WaCatalogProduct {
  const id = (product.handle || product.id.replace(/^line:/, '')).trim()
  const variants =
    product.variantImageOptions
      ?.map((option) => option.label?.trim())
      .filter((label): label is string => Boolean(label)) || []

  // Prefer unique variant labels; drop empties / dupes.
  const uniqueVariants = [...new Set(variants)]

  return {
    id,
    name: product.name,
    category: product.category,
    description: product.description?.slice(0, 280) || undefined,
    price_ghs: Number.isFinite(product.price) ? product.price : null,
    stock_status: stockStatus(product.stock),
    variants: uniqueVariants,
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

  // Ensure stable unique ids (handle collisions by keeping first).
  const seen = new Set<string>()
  const unique: WaCatalogProduct[] = []
  for (const product of mapped) {
    if (seen.has(product.id)) continue
    seen.add(product.id)
    unique.push(product)
  }
  return unique
}
