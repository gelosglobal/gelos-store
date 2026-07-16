import { normalizeImageUrl } from '@/lib/image-url'
import {
  getProductVariantPickerOptions,
  productNeedsVariantChoice,
} from '@/lib/product-variant-images'
import { getProductHref } from '@/lib/product-utils'
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
  product: Pick<Product, 'id' | 'name'>,
  flavourLabel: string,
): string {
  const slug = getFlavourSlug(flavourLabel)
  const base = getProductHref(product)
  return slug ? `${base}?flavour=${encodeURIComponent(slug)}` : base
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

function shouldExpandProductVariants(product: Product): boolean {
  if (!EXPAND_VARIANT_CATEGORIES.has(product.category)) return false
  return productNeedsVariantChoice(product)
}

/**
 * Expand multi-flavour admin variants into one catalog card per flavour.
 * Single-SKU products without a flavour picker stay as one card.
 */
export function expandProductsForShopCatalog(
  products: Product[],
): ShopCatalogItem[] {
  const items: ShopCatalogItem[] = []

  for (const product of products) {
    if (!shouldExpandProductVariants(product)) {
      items.push({
        key: product.id,
        product,
        displayName: product.name,
        image: normalizeImageUrl(product.image),
        flavourLocked: false,
        href: getProductHref(product),
      })
      continue
    }

    const options = getProductVariantPickerOptions(product)
    for (const option of options) {
      const label = option.label.trim() || 'Variant'
      const displayName = buildVariantDisplayName(product, option)
      const image = normalizeImageUrl(option.url)

      items.push({
        key: `${product.id}:${getFlavourSlug(label) || image}`,
        product,
        displayName,
        image,
        variantImage: image,
        variantLabel: label,
        flavourLocked: true,
        href: getProductFlavourHref(product, label),
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
