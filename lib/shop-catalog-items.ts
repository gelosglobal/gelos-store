import { normalizeImageUrl } from '@/lib/image-url'
import {
  getProductVariantPickerOptions,
  productNeedsVariantChoice,
} from '@/lib/product-variant-images'
import { getProductHref } from '@/lib/product-utils'
import {
  collapseProductsIntoLineParents,
  getProductLineParentConfigForProduct,
  isProductLineParentId,
} from '@/lib/product-line-parents'
import { isGenericMultiFlavourProduct } from '@/lib/variant-display'
import type { Product } from '@/lib/types/product'
import type { ProductVariantOption } from '@/lib/types/product-variant'

export type ShopCatalogItem = {
  key: string
  product: Product
  displayName: string
  image: string
  variantImage?: string
  variantLabel?: string
  /** When true, flavour is fixed — card should not open a picker. */
  flavourLocked: boolean
  href: string
}

/** Categories that should show each admin flavour/style as its own catalog card. */
const EXPAND_VARIANT_CATEGORIES = new Set([
  'Toothpaste',
  'Mouthwash',
  'Tongue Scraper',
  'Toothbrushes',
  'Wellness',
  'Whitening',
])

export function getFlavourSlug(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function getProductFlavourHref(
  product: Pick<Product, 'id' | 'name'> & { handle?: string },
  flavourLabel: string,
): string {
  const slug = getFlavourSlug(flavourLabel)
  const base = getProductHref(product)
  return slug ? `${base}?flavour=${encodeURIComponent(slug)}` : base
}

/**
 * Flavour/colour SKUs in a line (toothpaste, mouthwash, SonicWave) link to the
 * shared parent PDP with that flavour selected, not the standalone SKU page.
 */
export function getLineAwareProductHref(
  product: Pick<Product, 'id' | 'name' | 'handle' | 'category'>,
): string {
  if (isProductLineParentId(product.id)) {
    return getProductHref(product)
  }

  const config = getProductLineParentConfigForProduct(product)
  if (!config) return getProductHref(product)

  const handle = (product.handle || '').toLowerCase()
  if (handle === config.handle) {
    return getProductHref({ ...product, handle: config.handle })
  }

  const label = config.labelFromName(product.name)
  return getProductFlavourHref(
    { id: config.id, name: config.name, handle: config.handle },
    label,
  )
}

function buildVariantDisplayName(
  product: Product,
  option: ProductVariantOption,
): string {
  const label = option.label.trim()
  if (!label) return product.name

  const categorySuffixes: Record<string, string> = {
    Toothpaste: 'Toothpaste',
    Mouthwash: 'Mouthwash',
    'Tongue Scraper': 'Tongue Scraper',
    Toothbrushes: 'Toothbrush',
    Wellness: '',
    Whitening: '',
  }

  const suffix = categorySuffixes[product.category]
  if (!suffix) return label

  // Avoid "Watermelon Toothpaste Toothpaste"
  if (new RegExp(`\\b${suffix}$`, 'i').test(label)) return label
  if (new RegExp(`\\b${suffix}\\b`, 'i').test(product.name) && label.length < product.name.length) {
    return `${label} ${suffix}`
  }

  return `${label} ${suffix}`
}

/** True when the catalogue title is itself a flavour SKU (e.g. "Watermelon Toothpaste"). */
function isFlavourNamedSku(product: Product): boolean {
  return !isGenericMultiFlavourProduct(product) && productNeedsVariantChoice(product)
}

function shouldExpandProductVariants(
  product: Product,
  expandGenericMultiFlavour = false,
): boolean {
  if (!EXPAND_VARIANT_CATEGORIES.has(product.category)) return false
  if (!productNeedsVariantChoice(product)) return false
  // Mega menu can expand generic parents (Flavored Toothpaste → each flavour).
  // Shop/browse keeps those as one card unless the title is a flavour SKU.
  if (expandGenericMultiFlavour) return true
  return isFlavourNamedSku(product)
}

/**
 * Expand multi-flavour admin variants into one catalog card per flavour.
 * Single-SKU products without a flavour picker stay as one card.
 * Generic multi-flavour parents (e.g. Flavored Toothpaste) also stay one card
 * unless `expandGenericMultiFlavour` is true (mega-menu flavour grid).
 * Shopify toothpaste/mouthwash flavour SKUs collapse into one parent card
 * unless `collapseLineParents` is false (e.g. mega-menu flavour grid).
 */
export function expandProductsForShopCatalog(
  products: Product[],
  options?: {
    collapseLineParents?: boolean
    expandGenericMultiFlavour?: boolean
  },
): ShopCatalogItem[] {
  const catalogProducts =
    options?.collapseLineParents === false
      ? products
      : collapseProductsIntoLineParents(products)
  const expandGeneric = options?.expandGenericMultiFlavour === true
  const items: ShopCatalogItem[] = []

  for (const product of catalogProducts) {
    if (!shouldExpandProductVariants(product, expandGeneric)) {
      items.push({
        key: product.id,
        product,
        displayName: product.name,
        image: normalizeImageUrl(product.image),
        flavourLocked: false,
        href: getLineAwareProductHref(product),
      })
      continue
    }

    const variantOptions = getProductVariantPickerOptions(product)
    const lineConfig = getProductLineParentConfigForProduct(product)
    const hrefTarget =
      isProductLineParentId(product.id) || !lineConfig
        ? product
        : {
            id: lineConfig.id,
            name: lineConfig.name,
            handle: lineConfig.handle,
          }

    for (const option of variantOptions) {
      const label = option.label.trim() || 'Variant'
      // Mega-menu flavour grid: show the flavour name only (Watermelon).
      // Elsewhere keep "Watermelon Toothpaste" style titles.
      const displayName = expandGeneric
        ? label
        : buildVariantDisplayName(product, option)
      const image = normalizeImageUrl(option.url)

      items.push({
        key: `${product.id}:${getFlavourSlug(label) || image}`,
        product,
        displayName,
        image,
        variantImage: image,
        variantLabel: label,
        flavourLocked: true,
        href: getProductFlavourHref(hrefTarget, label),
      })
    }
  }

  return items
}

export function findVariantOptionByFlavourSlug(
  product: Product,
  flavourSlug: string,
): ProductVariantOption | undefined {
  const normalized = getFlavourSlug(flavourSlug)
  if (!normalized) return undefined

  return getProductVariantPickerOptions(product).find(
    (option) => getFlavourSlug(option.label) === normalized,
  )
}
