import { getProductSlug } from '@/lib/product-utils'
import type { Product } from '@/lib/types/product'

/**
 * Shopify product handles → Gelos content-by-slug keys.
 * Keeps PDP copy resolution working when Shopify URLs differ from legacy slugs.
 */
const CONTENT_SLUG_ALIASES: Record<string, string> = {
  // Wellness / inhalers
  'full-energy-inhaler-grape-mint': 'grape-mint-fruit-energy',

  // Toothpaste
  toothpaste: 'red-velvet-toothpaste',
  'strawberry-toothpaste-1': 'strawberry-toothpaste',
  'candy-cane-tooth-paste': 'candy-cane-toothpaste',
  'passion-fruit-toothapaste': 'passion-fruit-toothpaste',

  // Mouthwash
  'blue-raspberry-foaming-mouth-wash': 'blue-raspberry-foaming-mouthwash',
  'strawberry-mouthwash': 'strawberry-foaming-mouthwash',
  'id-stain-mouthwash': 'id-stain-whitening-mouthwash',
  'id-stain': 'id-stain-whitening-mouthwash',
  'gelos-id-stain-whitening-mouthwash': 'id-stain-whitening-mouthwash',
  'id-whitening-mouthwash': 'id-stain-whitening-mouthwash',
  'id-stain-whitening-mouth-wash': 'id-stain-whitening-mouthwash',

  // Tongue scrapers
  'tongue-scraper': 'stainless-steel-tongue-scraper',
  'tongue-scraper-2': 'stainless-steel-tongue-scraper',
  '3-in-1-tongue-scraper': 'stainless-steel-tongue-scraper',
  'tongue-scraper-1': 'copper-tongue-scraper',

  // Toothbrushes
  'bamboo-toothbrush': 'bamboo-toothbrush-set-3-pack',
  'bamboo-toothbrush-1': 'bamboo-toothbrush-set-3-pack',
  'electric-toothbrush': 'sonicwave-g1-series-electric-toothbrush',
  'white-electric-toothbrush': 'sonicwave-g1-series-electric-toothbrush',
  'pink-electric-toothbrush': 'sonicwave-g1-series-electric-toothbrush',
  'blue-electric-toothbrush': 'sonicwave-g1-series-electric-toothbrush',
  'green-electric-toothbrush': 'sonicwave-g1-series-electric-toothbrush',
  '3d-sonicwave-g1-electric-toothbrush':
    'sonicwave-g1-series-electric-toothbrush',
  'gelos-electric-toothbrush-pro': 'electric-toothbrush-pro',
  'electric-toothbrush-pro-1': 'electric-toothbrush-pro',
  'toothbrush-pro': 'electric-toothbrush-pro',

  // Whitening
  'teeth-whitening-strips-pap': 'premium-whitening-strips-30-pairs',
  'v34-colour-correcting-serum': 'v34-shade-correction-kit',
  'v34-color-correcting-serum': 'v34-shade-correction-kit',
  'v34-3-in-1-shade-correction-kit': 'v34-shade-correction-kit',

  // Accessories (legacy content key reused tooth-tattoo copy)
  'tooth-tattoo': 'candy-cane-toothpaste',

  // Water flossers
  'gelos-hydrelle-pro-water-flosser': 'hydrelle-pro-water-flosser',
  'hydrelle-pro': 'hydrelle-pro-water-flosser',
  'hydrelle-pro-water-flosser-1': 'hydrelle-pro-water-flosser',
  'water-flosser-hydrelle-pro': 'hydrelle-pro-water-flosser',
}

/** Wellness SKUs that use whitening PDP copy (serums, oils, powders). */
const WELLNESS_STANDALONE_CONTENT_SLUGS = new Set([
  'hyaluronic-serum',
  'nhpro-enamel-care',
  'pulling-oil-coconut-mint-free-tongue-scraper',
  'activated-charcoal-powder',
  'tumeric-teeth-whitening-powder',
])

/** Legacy Prisma/mock product IDs that are wellness standalones. */
const WELLNESS_STANDALONE_LEGACY_IDS = new Set(['28', '29', '31'])

/**
 * Slug used to look up rich PDP content (after Shopify handle aliases).
 */
export function getProductContentSlug(
  product: Pick<Product, 'name'> & { handle?: string },
): string {
  const slug = getProductSlug(product)
  return CONTENT_SLUG_ALIASES[slug] ?? slug
}

export function isWellnessStandaloneProduct(
  product: Pick<Product, 'id' | 'name'> & { handle?: string },
): boolean {
  if (WELLNESS_STANDALONE_LEGACY_IDS.has(product.id)) return true
  const slug = getProductContentSlug(product)
  const handle = product.handle?.trim().toLowerCase()
  return (
    WELLNESS_STANDALONE_CONTENT_SLUGS.has(slug) ||
    (handle ? WELLNESS_STANDALONE_CONTENT_SLUGS.has(handle) : false)
  )
}
