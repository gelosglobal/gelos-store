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
  /** Curated flavour order (handles / slugs / legacy ids) */
  order: readonly string[]
  labelFromName: (name: string) => string
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
    'mouth-spray',
  ],
  labelFromName: (name) =>
    name
      .replace(/ Foaming Mouthwash$/i, '')
      .replace(/ Mouthwash$/i, '')
      .replace(/ Mouth Spray$/i, 'Spray')
      .trim(),
}

const LINE_PARENTS = [TOOTHPASTE_LINE_PARENT, MOUTHWASH_LINE_PARENT] as const

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

export function getProductLineParentConfigForCategory(
  category: string,
): ProductLineParentConfig | null {
  return LINE_PARENTS.find((parent) => parent.category === category) ?? null
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

/** Build a catalogue parent that owns every flavour as admin variant tiles. */
export function buildProductLineParent(
  members: Product[],
  config: ProductLineParentConfig,
): Product | null {
  const inCategory = members.filter(
    (product) => product.category === config.category && product.active !== false,
  )
  if (inCategory.length <= 1) return null

  const options = buildVariantOptions(inCategory, config)
  if (options.length <= 1) return null

  const primary =
    sortProductsByLineOrder(inCategory, config.order)[0] ?? inCategory[0]
  const ratings = resolveProductRatings(primary)

  return {
    id: config.id,
    name: config.name,
    category: config.category,
    price: primary.price,
    rating: ratings.rating,
    reviews: ratings.reviews,
    image: options[0]?.url || primary.image,
    description: primary.description,
    stock: options.reduce((sum, option) => sum + (option.stock ?? 0), 0),
    tags: primary.tags,
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
 * Replace per-flavour SKUs with one parent card for configured categories.
 * Other products pass through unchanged.
 */
export function collapseProductsIntoLineParents(
  products: Product[],
): Product[] {
  const collapsedCategories = new Set<string>()
  const parents: Product[] = []

  for (const config of LINE_PARENTS) {
    const parent = buildProductLineParent(products, config)
    if (!parent) continue
    parents.push(parent)
    collapsedCategories.add(config.category)
  }

  if (parents.length === 0) return products

  const rest = products.filter(
    (product) => !collapsedCategories.has(product.category),
  )
  return [...parents, ...rest]
}

/** Resolve cart product id to the real Shopify flavour SKU when present. */
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
 * belongs to a flavour line, replace those SKUs with one parent card that owns
 * all flavours (same UX as the shop category grid).
 */
export function presentProductsForStorefrontSections(
  selected: Product[],
  allProducts: Product[],
): Product[] {
  if (selected.length === 0) return selected

  const insertedCategories = new Set<string>()
  const result: Product[] = []

  for (const product of selected) {
    const config = getProductLineParentConfigForCategory(product.category)
    if (!config) {
      result.push(product)
      continue
    }

    if (insertedCategories.has(config.category)) continue

    const parent = buildProductLineParent(allProducts, config)
    if (!parent) {
      result.push(product)
      continue
    }

    const selectedInLine = selected.filter(
      (item) => item.category === config.category,
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
    insertedCategories.add(config.category)
  }

  return result
}
