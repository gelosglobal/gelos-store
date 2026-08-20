import { getProductSlug } from '@/lib/product-utils'
import type { Product } from '@/lib/types/product'

/**
 * Legacy Prisma `productId` / slug → Shopify handle after catalog migration.
 * Used to bridge admin bundles across catalog modes.
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

/**
 * Shopify product IDs that were written into Gelos bundles/collections
 * during the Storefront catalog experiment → Storefront handles.
 */
export const SHOPIFY_PRODUCT_ID_TO_HANDLE: Record<string, string> = {
  '8152415830215': 'watermelon-toothpaste',
  '8510619451591': 'blue-raspberry-foaming-mouth-wash',
  '8163153379527': 'tongue-scraper-2',
  '8233923772615': 'pink-electric-toothbrush',
  '8360030634183': 'pulling-oil-coconut-mint-free-tongue-scraper',
  '8163272818887': 'water-flosser-1',
  '8577161789639': 'nhpro-enamel-care',
  '8149529985223': 'bamboo-toothbrush',
  '8163192340679': 'tongue-scraper-with-plastic-handle-3',
  '8264253702343': 'mouth-spray',
  '8415528517831': 'portable-water-flosser-cs1',
  '8577194098887': 'teeth-whitening-strips-pap',
  '8577164345543': 'teeth-whitening-kit',
  '8535490560199': 'full-energy-inhaler-grape-mint',
}

function productHandle(product: Product): string {
  return (product.handle || getProductSlug(product)).trim().toLowerCase()
}

function prismaIdForHandle(
  handle: string,
  products: Product[],
): string | undefined {
  const normalized = handle.trim().toLowerCase()
  if (!normalized) return undefined

  const byHandle = products.find(
    (product) => productHandle(product) === normalized,
  )
  if (byHandle) return byHandle.id

  for (const [legacyId, mappedHandle] of Object.entries(
    LEGACY_BUNDLE_PRODUCT_TO_HANDLE,
  )) {
    if (mappedHandle !== normalized) continue
    if (!/^\d+$/.test(legacyId)) continue
    if (products.some((product) => product.id === legacyId)) return legacyId
  }

  return undefined
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

  const shopifyHandle = SHOPIFY_PRODUCT_ID_TO_HANDLE[key]
  if (shopifyHandle) {
    const fromShopify = prismaIdForHandle(shopifyHandle, products)
    if (fromShopify) return fromShopify
  }

  const aliasedHandle = LEGACY_BUNDLE_PRODUCT_TO_HANDLE[key]
  if (aliasedHandle) {
    const fromLegacy = prismaIdForHandle(aliasedHandle, products)
    if (fromLegacy) return fromLegacy
  }

  return prismaIdForHandle(key, products)
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
