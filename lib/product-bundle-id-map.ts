import { getProductSlug } from '@/lib/product-utils'
import type { Product } from '@/lib/types/product'

/**
 * Legacy Prisma `productId` / slug → Shopify handle after catalog migration.
 * Admin bundles still store old numeric IDs; the storefront catalog uses Shopify ids.
 */
export const LEGACY_BUNDLE_PRODUCT_TO_HANDLE: Record<string, string> = {
  '1': 'watermelon-toothpaste',
  'flavored-toothpaste': 'watermelon-toothpaste',
  '2': 'tongue-scraper-2',
  '3-in-1-tongue-scraper': 'tongue-scraper-2',
  '3': 'v34-teeth-whitening-kit',
  'v34-shade-correction-kit': 'v34-teeth-whitening-kit',
  '7': 'teeth-whitening-strips-pap',
  'premium-whitening-strips-14-strips': 'teeth-whitening-strips-pap',
  '8': 'bamboo-toothbrush',
  '9': 'full-energy-inhaler-grape-mint',
  'grape-mint-fruit-energy': 'full-energy-inhaler-grape-mint',
  '10': 'teeth-whitening-kit',
  'led-whitening-device': 'teeth-whitening-kit',
  '11': 'energy-drink-toothpaste',
  '12': 'watermelon-foaming-mouthwash',
  '15': 'strawberry-toothpaste',
  '21': 'blue-raspberry-foaming-mouth-wash',
  'foaming-mouthwash': 'blue-raspberry-foaming-mouth-wash',
  '25': 'pink-electric-toothbrush',
  'sonicwave-g1-series-electric-toothbrush': 'pink-electric-toothbrush',
  '29': 'nhpro-enamel-care',
  '30': 'mouth-spray',
  '31': 'pulling-oil-coconut-mint-free-tongue-scraper',
  '35': 'water-flosser-1',
  'portable-water-flosser': 'water-flosser-1',
  '36': 'portable-water-flosser-cs1',
  '38': 'tongue-scraper-with-plastic-handle-3',
  'single-tongue-scraper': 'tongue-scraper-with-plastic-handle-3',
}

function productHandle(product: Product): string {
  return (product.handle || getProductSlug(product)).trim().toLowerCase()
}

/** Map a stored bundle product id (legacy or Shopify) onto a live catalog id. */
export function resolveBundleProductIdAgainstCatalog(
  productId: string,
  products: Product[],
): string | undefined {
  if (products.some((product) => product.id === productId)) {
    return productId
  }

  const key = productId.trim().toLowerCase()
  const aliasedHandle = LEGACY_BUNDLE_PRODUCT_TO_HANDLE[key]
  if (aliasedHandle) {
    const match = products.find(
      (product) => productHandle(product) === aliasedHandle,
    )
    if (match) return match.id
  }

  const byHandle = products.find((product) => productHandle(product) === key)
  return byHandle?.id
}

export function remapBundleProductIds(
  productIds: string[],
  products: Product[],
): string[] {
  const resolved: string[] = []
  const seen = new Set<string>()

  for (const productId of productIds) {
    const nextId = resolveBundleProductIdAgainstCatalog(productId, products)
    if (!nextId || seen.has(nextId)) continue
    seen.add(nextId)
    resolved.push(nextId)
  }

  return resolved
}
