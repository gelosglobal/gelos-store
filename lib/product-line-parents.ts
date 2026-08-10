import { sortProductsByLineOrder } from '@/lib/product-line-keys'
import { getProductSlug } from '@/lib/product-utils'
import { normalizeImageUrl } from '@/lib/image-url'
import { resolveProductRatings } from '@/lib/product-ratings'
import type { Product } from '@/lib/types/product'
import type { ProductVariantOption } from '@/lib/types/product-variant'

export type ProductLineParentConfig = {
  /** Stable synthetic id + handle slug */
  id: string
  handle: string
  name: string
  category: string
  /** Curated flavour/style order (handles / slugs / legacy ids) */
  order: readonly string[]
  labelFromName: (name: string) => string
  /**
   * Optional subset filter. When set, only matching products in the category
   * collapse into this parent (e.g. SonicWave colours within Toothbrushes).
   */
  isMember?: (product: Pick<Product, 'id' | 'name' | 'handle' | 'category'>) => boolean
  /**
   * Optional exclusions within a whole-category line (e.g. Mouth Spray stays
   * its own PDP while other Mouthwash SKUs collapse into Foaming Mouthwash).
   */
  excludeMember?: (
    product: Pick<Product, 'id' | 'name' | 'handle' | 'category'>,
  ) => boolean
}

export const TOOTHPASTE_LINE_PARENT: ProductLineParentConfig = {
  id: 'line:flavored-toothpaste',
  handle: 'flavored-toothpaste',
  name: 'Flavored Toothpaste',
  category: 'Toothpaste',
  order: [
    'watermelon-toothpaste',
    'strawberry-toothpaste',
    'strawberry-toothpaste-1',
    'coconut-whip-toothpaste',
    'grape-bubblegum-toothpaste',
    'banana-toothpaste',
    'smooth-mint-toothpaste-1',
    'mango-toothpaste',
    'peach-iced-tea-toothpaste',
    'passion-fruit-toothpaste',
    'passion-fruit-toothapaste',
    'red-velvet-toothpaste',
    'toothpaste',
    'vanilla-toothpaste',
    'energy-drink-toothpaste',
    'candy-cane-tooth-paste',
    'candy-cane-toothpaste',
    'chocolate-toothpaste',
    'untitled-oct15_11-07',
  ],
  labelFromName: (name) =>
    name
      .replace(/ Toothapaste$/i, '')
      .replace(/ Tooth Paste$/i, '')
      .replace(/ Toothpaste$/i, '')
      .trim(),
}

export const MOUTHWASH_LINE_PARENT: ProductLineParentConfig = {
  id: 'line:foaming-mouthwash',
  handle: 'foaming-mouthwash',
  name: 'Foaming Mouthwash',
  category: 'Mouthwash',
  order: [
    'watermelon-foaming-mouthwash',
    'strawberry-foaming-mouthwash',
    'strawberry-mouthwash',
    'blue-raspberry-foaming-mouthwash',
    'blue-raspberry-foaming-mouth-wash',
    'grape-bubblegum-foaming-mouthwash',
  ],
  labelFromName: (name) =>
    name
      .replace(/ Foaming Mouthwash$/i, '')
      .replace(/ Mouthwash$/i, '')
      .trim(),
  // Only foaming flavour SKUs collapse here — Mouth Spray, ID Stain, etc. stay solo.
  excludeMember: (product) => !isFoamingMouthwashFlavour(product),
}

const MOUTH_SPRAY_RE = /mouth\s*spray/i
const ID_STAIN_RE = /\bid[\s-]*stain\b|\bid[\s-]*whitening\b/i

/** Known foaming mouthwash handles that may omit "foaming" in the title. */
const FOAMING_MOUTHWASH_HANDLES = new Set([
  'watermelon-foaming-mouthwash',
  'strawberry-foaming-mouthwash',
  'strawberry-mouthwash',
  'blue-raspberry-foaming-mouthwash',
  'blue-raspberry-foaming-mouth-wash',
  'grape-bubblegum-foaming-mouthwash',
])

export function isMouthSprayProduct(
  product: Pick<Product, 'name' | 'handle' | 'id'>,
): boolean {
  const handle = (product.handle || '').toLowerCase()
  if (
    handle === 'mouth-spray' ||
    handle.includes('mouth-spray') ||
    handle.includes('mouthspray')
  ) {
    return true
  }
  if (MOUTH_SPRAY_RE.test(product.name)) return true
  const id = product.id.toLowerCase()
  return id === 'mouth-spray' || id.includes('mouth-spray')
}

export function isIdStainMouthwashProduct(
  product: Pick<Product, 'name' | 'handle' | 'id'>,
): boolean {
  const handle = (product.handle || '').toLowerCase()
  if (
    handle.includes('id-stain') ||
    handle.includes('id-whitening') ||
    handle.includes('idstain')
  ) {
    return true
  }
  if (ID_STAIN_RE.test(product.name)) return true
  const id = product.id.toLowerCase()
  return id.includes('id-stain') || id.includes('id-whitening')
}

/** True for foaming flavour SKUs that belong under Foaming Mouthwash. */
export function isFoamingMouthwashFlavour(
  product: Pick<Product, 'name' | 'handle' | 'id' | 'category'>,
): boolean {
  if (product.category !== 'Mouthwash') return false
  if (isMouthSprayProduct(product)) return false
  if (isIdStainMouthwashProduct(product)) return false

  const handle = (product.handle || '').toLowerCase()
  const slug = getProductSlug(product)
  if (FOAMING_MOUTHWASH_HANDLES.has(handle) || FOAMING_MOUTHWASH_HANDLES.has(slug)) {
    return true
  }
  return /foaming/i.test(product.name) || handle.includes('foaming')
}

const SONICWAVE_NAME_RE = /sonicwave\s*g1\s*series\s*electric\s*toothbrush/i

export function isSonicwaveElectricToothbrush(
  product: Pick<Product, 'name' | 'handle'>,
): boolean {
  if (SONICWAVE_NAME_RE.test(product.name)) return true
  const handle = (product.handle || '').toLowerCase()
  return (
    handle === 'electric-toothbrush' ||
    handle === 'white-electric-toothbrush' ||
    handle === 'pink-electric-toothbrush' ||
    handle === 'blue-electric-toothbrush' ||
    handle === 'green-electric-toothbrush' ||
    handle === 'sonicwave-g1-series-electric-toothbrush' ||
    handle === '3d-sonicwave-g1-electric-toothbrush'
  )
}

export const SONICWAVE_LINE_PARENT: ProductLineParentConfig = {
  id: 'line:sonicwave-g1',
  handle: 'sonicwave-g1-series-electric-toothbrush',
  name: 'SonicWave G1 Series Electric Toothbrush',
  category: 'Toothbrushes',
  order: [
    'electric-toothbrush',
    'white-electric-toothbrush',
    'pink-electric-toothbrush',
    'blue-electric-toothbrush',
    'green-electric-toothbrush',
    'sonicwave-g1-series-electric-toothbrush',
    '3d-sonicwave-g1-electric-toothbrush',
  ],
  labelFromName: (name) => {
    const colour = name.match(/-\s*([^-]+)\s*$/)
    if (colour?.[1]?.trim()) return colour[1].trim()
    return (
      name
        .replace(/SonicWave G1 Series Electric Toothbrush/i, '')
        .replace(/^[-–\s]+/, '')
        .trim() || 'Brush'
    )
  },
  isMember: (product) => isSonicwaveElectricToothbrush(product),
}

const LINE_PARENTS = [
  TOOTHPASTE_LINE_PARENT,
  MOUTHWASH_LINE_PARENT,
  SONICWAVE_LINE_PARENT,
] as const

export function isProductLineParentId(id: string): boolean {
  return id.startsWith('line:')
}

export function getProductLineParentConfigBySlug(
  slugOrId: string,
): ProductLineParentConfig | null {
  const key = slugOrId.trim().toLowerCase()
  return (
    LINE_PARENTS.find(
      (parent) => parent.handle === key || parent.id === key,
    ) ?? null
  )
}

/** Whole-category parents only (Toothpaste / Mouthwash). */
export function getProductLineParentConfigForCategory(
  category: string,
): ProductLineParentConfig | null {
  return (
    LINE_PARENTS.find(
      (parent) => parent.category === category && !parent.isMember,
    ) ?? null
  )
}

/** Resolve the line parent config for a specific product (category or subset). */
export function getProductLineParentConfigForProduct(
  product: Pick<Product, 'id' | 'name' | 'handle' | 'category'>,
): ProductLineParentConfig | null {
  const byMember = LINE_PARENTS.find((parent) => parent.isMember?.(product))
  if (byMember) return byMember

  const byCategory = getProductLineParentConfigForCategory(product.category)
  if (byCategory?.excludeMember?.(product)) return null
  return byCategory
}

function getLineMembers(
  products: Product[],
  config: ProductLineParentConfig,
): Product[] {
  return products.filter(
    (product) =>
      product.category === config.category &&
      product.active !== false &&
      (config.isMember ? config.isMember(product) : true) &&
      !(config.excludeMember?.(product) ?? false),
  )
}

function buildVariantOptions(
  members: Product[],
  config: ProductLineParentConfig,
): ProductVariantOption[] {
  const sorted = sortProductsByLineOrder(members, config.order)
  const options: ProductVariantOption[] = []
  const seen = new Set<string>()

  for (const member of sorted) {
    const url = normalizeImageUrl(member.image)
    if (!url || seen.has(url)) continue
    seen.add(url)
    const label = config.labelFromName(member.name) || member.name
    options.push({
      url,
      label,
      stock: member.stock,
      shopifyVariantGid: member.shopifyVariantGid,
      sourceProductId: member.id,
    })
  }

  return options
}

/** Build a catalogue parent that owns every flavour/colour as admin variant tiles. */
export function buildProductLineParent(
  members: Product[],
  config: ProductLineParentConfig,
): Product | null {
  const inLine = getLineMembers(members, config)
  if (inLine.length <= 1) return null

  const options = buildVariantOptions(inLine, config)
  if (options.length <= 1) return null

  const primary = sortProductsByLineOrder(inLine, config.order)[0] ?? inLine[0]
  const ratings = resolveProductRatings(primary)

  return {
    id: config.id,
    name: config.name,
    category: config.category,
    price: primary.price,
    ...(primary.compareAtPrice !== undefined &&
    primary.compareAtPrice > primary.price
      ? { compareAtPrice: primary.compareAtPrice }
      : {}),
    rating: ratings.rating,
    reviews: ratings.reviews,
    image: options[0]?.url || primary.image,
    description: primary.description,
    stock: options.reduce((sum, option) => sum + (option.stock ?? 0), 0),
    tags: Array.from(
      new Set(inLine.flatMap((product) => product.tags ?? [])),
    ),
    variantImages: options.map((option) => option.url),
    variantImageOptions: options,
    galleryImages: primary.galleryImages ?? [],
    carouselImages: options.map((option) => option.url),
    active: true,
    handle: config.handle,
    shopifyProductGid: primary.shopifyProductGid,
    shopifyVariantGid: options[0]?.shopifyVariantGid || primary.shopifyVariantGid,
  }
}

export function buildAllProductLineParents(products: Product[]): Product[] {
  const parents: Product[] = []
  for (const config of LINE_PARENTS) {
    const parent = buildProductLineParent(products, config)
    if (parent) parents.push(parent)
  }
  return parents
}

/**
 * Replace per-flavour / per-colour SKUs with one parent card for configured lines.
 * Other products pass through unchanged.
 */
export function collapseProductsIntoLineParents(
  products: Product[],
): Product[] {
  const collapsedIds = new Set<string>()
  const parents: Product[] = []

  for (const config of LINE_PARENTS) {
    const parent = buildProductLineParent(products, config)
    if (!parent) continue
    parents.push(parent)
    for (const member of getLineMembers(products, config)) {
      collapsedIds.add(member.id)
    }
  }

  if (parents.length === 0) return products

  const rest = products.filter((product) => !collapsedIds.has(product.id))
  return [...parents, ...rest]
}

/** Resolve cart product id to the real Shopify flavour/colour SKU when present. */
export function resolveCartProductId(
  product: Pick<Product, 'id' | 'variantImageOptions'>,
  options?: { variantImage?: string; variantLabel?: string },
): string {
  const variants = product.variantImageOptions ?? []
  if (variants.length === 0) return product.id

  if (options?.variantImage) {
    const image = normalizeImageUrl(options.variantImage)
    const match = variants.find(
      (option) => normalizeImageUrl(option.url) === image,
    )
    if (match?.sourceProductId) return match.sourceProductId
  }

  if (options?.variantLabel?.trim()) {
    const label = options.variantLabel.trim().toLowerCase()
    const match = variants.find(
      (option) => option.label.trim().toLowerCase() === label,
    )
    if (match?.sourceProductId) return match.sourceProductId
  }

  return product.id
}

export function isProductLineParentProduct(
  product: Pick<Product, 'id' | 'handle' | 'name'>,
): boolean {
  if (isProductLineParentId(product.id)) return true
  const handle = product.handle || getProductSlug(product)
  return Boolean(getProductLineParentConfigBySlug(handle))
}

/**
 * For homepage carousels (best sellers, new arrivals): if any selected product
 * belongs to a flavour/colour line, replace those SKUs with one parent card.
 */
export function presentProductsForStorefrontSections(
  selected: Product[],
  allProducts: Product[],
): Product[] {
  if (selected.length === 0) return selected

  const insertedLineIds = new Set<string>()
  const result: Product[] = []

  for (const product of selected) {
    const config = getProductLineParentConfigForProduct(product)
    if (!config) {
      result.push(product)
      continue
    }

    if (insertedLineIds.has(config.id)) continue

    const parent = buildProductLineParent(allProducts, config)
    if (!parent) {
      result.push(product)
      continue
    }

    const selectedInLine = selected.filter((item) =>
      config.isMember
        ? config.isMember(item)
        : item.category === config.category,
    )
    const mergedTags = [
      ...new Set([
        ...parent.tags,
        ...selectedInLine.flatMap((item) => item.tags ?? []),
      ]),
    ]

    result.push({
      ...parent,
      tags: mergedTags,
    })
    insertedLineIds.add(config.id)
  }

  return result
}
