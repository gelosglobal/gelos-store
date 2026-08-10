import { normalizeImageUrl } from '@/lib/image-url'
import { normalizeProductTags, type ProductTagId } from '@/lib/product-tags'
import {
  isGalleryVideoEntry,
  normalizeGalleryImages,
} from '@/lib/product-gallery-images'
import {
  galleryImagesFromShopifyMetafield,
  type ShopifyGalleryMetafield,
} from '@/lib/shopify/gallery-metafield'
import {
  pdpContentFromShopifyMetafield,
  ratingsFromShopifyPdpMetafield,
  type ShopifyPdpMetafield,
} from '@/lib/shopify/pdp-metafield'
import { resolveProductRatings } from '@/lib/product-ratings'
import type { ProductPdpContent } from '@/lib/product-pdp-content'
import type { Product } from '@/lib/types/product'
import type { ProductVariantOption } from '@/lib/types/product-variant'

/** Shopify Storefront product node (subset we query). */
export type ShopifyStorefrontProduct = {
  id: string
  handle: string
  title: string
  description: string
  productType: string
  tags: string[]
  availableForSale: boolean
  featuredImage?: { url: string; altText?: string | null } | null
  images: {
    nodes: Array<{ url: string; altText?: string | null }>
  }
  /** PDP feature gallery (Image 2) — custom.gallery metafield, not Media. */
  gallery?: ShopifyGalleryMetafield | null
  /** Structured PDP copy — custom.pdp JSON metafield. */
  pdp?: ShopifyPdpMetafield | null
  priceRange: {
    minVariantPrice: { amount: string; currencyCode: string }
  }
  compareAtPriceRange?: {
    maxVariantPrice?: { amount: string; currencyCode: string } | null
  } | null
  variants: {
    nodes: Array<{
      id: string
      title: string
      availableForSale: boolean
      image?: { url: string; altText?: string | null } | null
      price: { amount: string; currencyCode: string }
      compareAtPrice?: { amount: string; currencyCode: string } | null
      selectedOptions: Array<{ name: string; value: string }>
    }>
  }
}

export type ShopifyMappedProduct = Product & {
  /** Shopify Product GID */
  shopifyProductGid: string
  /** Default / first available variant GID (merchandiseId for cart). */
  shopifyVariantGid: string
  handle: string
  /** Parsed custom.pdp metafield when present. */
  shopifyPdpContent?: Partial<ProductPdpContent> | null
}

function gidToLegacyId(gid: string): string {
  const parts = gid.split('/')
  return parts[parts.length - 1] || gid
}

function parseAmount(amount: string): number {
  const value = Number.parseFloat(amount)
  return Number.isFinite(value) ? value : 0
}

/** Prefer variant compare-at, then product range — only when above sale price. */
function resolveCompareAtPrice(
  salePrice: number,
  variantCompareAt?: string | null,
  rangeMaxCompareAt?: string | null,
): number | undefined {
  const candidates = [variantCompareAt, rangeMaxCompareAt]
    .map((value) => (value ? parseAmount(value) : 0))
    .filter((value) => value > salePrice)
  if (candidates.length === 0) return undefined
  return Math.max(...candidates)
}

/** Shopify admin tags → Gelos ProductTagId (hyphenated / plural variants). */
const SHOPIFY_TAG_ALIASES: Record<string, ProductTagId> = {
  'best-seller': 'best-seller',
  'best-sellers': 'best-seller',
  bestseller: 'best-seller',
  bestsellers: 'best-seller',
  'new-arrival': 'new-arrival',
  'new-arrivals': 'new-arrival',
  newarrival: 'new-arrival',
  newarrivals: 'new-arrival',
  featured: 'featured',
  bundle: 'bundle',
  bundles: 'bundle',
  combo: 'bundle',
  combos: 'bundle',
}

/** Shopify productType (any casing) → Gelos shop category strings. */
const SHOPIFY_CATEGORY_ALIASES: Record<string, string> = {
  toothpaste: 'Toothpaste',
  toothpastes: 'Toothpaste',
  'flavored toothpaste': 'Toothpaste',
  'flavoured toothpaste': 'Toothpaste',
  toothbrush: 'Toothbrushes',
  toothbrushes: 'Toothbrushes',
  'teeth whitener': 'Whitening',
  'teeth whitening': 'Whitening',
  whitener: 'Whitening',
  whitening: 'Whitening',
  'tongue scraper': 'Tongue Scraper',
  'tongue scrapers': 'Tongue Scraper',
  mouthwash: 'Mouthwash',
  'mouth wash': 'Mouthwash',
  'mouth washes': 'Mouthwash',
  'mouth spray': 'Mouthwash',
  'mouth sprays': 'Mouthwash',
  wellness: 'Wellness',
  'water flosser': 'Water Flossers',
  'water flossers': 'Water Flossers',
  'tooth tattoo': 'Accessories',
  accessories: 'Accessories',
  tools: 'Tools',
}

function tagsFromShopify(tags: string[]): ProductTagId[] {
  const mapped = tags.map((tag) => {
    const key = tag.trim().toLowerCase().replace(/\s+/g, '-')
    return SHOPIFY_TAG_ALIASES[key] ?? key
  })
  return normalizeProductTags(mapped)
}

function normalizeShopifyCategory(
  productType: string | null | undefined,
  title: string,
  handle: string,
): string {
  const handleKey = handle.trim().toLowerCase()
  const HANDLE_CATEGORY_OVERRIDES: Record<string, string> = {
    'pulling-oil-coconut-mint-free-tongue-scraper': 'Whitening',
    'hyaluronic-serum': 'Whitening',
  }
  if (HANDLE_CATEGORY_OVERRIDES[handleKey]) {
    return HANDLE_CATEGORY_OVERRIDES[handleKey]
  }

  const raw = productType?.trim() ?? ''
  if (raw) {
    const alias = SHOPIFY_CATEGORY_ALIASES[raw.toLowerCase()]
    if (alias) return alias
    // Already a Gelos canonical name (exact match after trim)
    const known = Object.values(SHOPIFY_CATEGORY_ALIASES)
    if (known.includes(raw)) return raw
  }

  const haystack = `${title} ${handle}`.toLowerCase()

  if (/water\s*flosser/.test(haystack)) return 'Water Flossers'
  if (/mouth\s*(wash|spray)|foaming\s*mouth/.test(haystack)) return 'Mouthwash'
  // Pulling oil / serums before tongue-scraper (bundle titles often include both)
  if (/pulling\s*oil|hyaluronic|enamel\s*care/.test(haystack)) {
    return 'Whitening'
  }
  if (/tongue\s*scraper/.test(haystack)) return 'Tongue Scraper'
  if (
    /whiten|whitener|v34|colour\s*correct|color\s*correct|pap\+/.test(
      haystack,
    )
  ) {
    return 'Whitening'
  }
  if (
    /toothbrush|brush\s*heads?|interdental\s*brush/.test(haystack)
  ) {
    return 'Toothbrushes'
  }
  if (/tooth\s*paste|toothapaste|toothpaste/.test(haystack)) return 'Toothpaste'
  if (/floss\s*pick|dental\s*floss/.test(haystack)) return 'Accessories'
  if (/inhaler|serum|nasal/.test(haystack)) {
    return 'Wellness'
  }
  if (/tattoo/.test(haystack)) return 'Accessories'

  return raw || 'General'
}

function variantLabel(variant: ShopifyStorefrontProduct['variants']['nodes'][number]) {
  if (variant.title && variant.title !== 'Default Title') return variant.title
  const values = variant.selectedOptions
    .map((option) => option.value)
    .filter((value) => value && value !== 'Default Title')
  return values.join(' / ') || 'Default'
}

/**
 * Map a Shopify Storefront product into the Gelos Product shape used by the UI.
 * Variant GIDs are kept for Shopify Cart / Checkout.
 */
export function mapShopifyProduct(
  node: ShopifyStorefrontProduct,
): ShopifyMappedProduct | null {
  const variants = node.variants.nodes
  if (variants.length === 0) return null

  const defaultVariant =
    variants.find((variant) => variant.availableForSale) ?? variants[0]

  const imageUrls = node.images.nodes
    .map((image) => normalizeImageUrl(image.url))
    .filter(Boolean)

  const featured = normalizeImageUrl(
    node.featuredImage?.url || imageUrls[0] || defaultVariant.image?.url || '',
  )

  const variantImageOptions: ProductVariantOption[] = variants
    .filter((variant) => variant.title !== 'Default Title' || variants.length > 1)
    .map((variant) => ({
      url: normalizeImageUrl(variant.image?.url || featured),
      label: variantLabel(variant),
      stock: variant.availableForSale ? 99 : 0,
      shopifyVariantGid: variant.id,
    }))

  // Attach shopifyVariantGid even when we only have a default variant (single SKU).
  if (variantImageOptions.length === 0) {
    variantImageOptions.push({
      url: featured,
      label: variantLabel(defaultVariant),
      stock: defaultVariant.availableForSale ? 99 : 0,
      shopifyVariantGid: defaultVariant.id,
    })
  }

  const stock = variants.reduce(
    (sum, variant) => sum + (variant.availableForSale ? 1 : 0),
    0,
  )

  const pdpPartial = pdpContentFromShopifyMetafield(node.pdp)
  const galleryFromFiles = galleryImagesFromShopifyMetafield(node.gallery)
  const galleryFromPdp = pdpPartial?.galleryImages ?? []
  const fromMetafield = ratingsFromShopifyPdpMetafield(node.pdp)
  const ratings =
    fromMetafield ??
    resolveProductRatings({
      name: node.title,
      handle: node.handle,
      rating: 4.8,
      reviews: 0,
    })

  const price = parseAmount(
    defaultVariant.price.amount || node.priceRange.minVariantPrice.amount,
  )
  const compareAtPrice = resolveCompareAtPrice(
    price,
    defaultVariant.compareAtPrice?.amount,
    node.compareAtPriceRange?.maxVariantPrice?.amount,
  )

  return {
    id: gidToLegacyId(node.id),
    name: node.title,
    category: normalizeShopifyCategory(
      node.productType,
      node.title,
      node.handle,
    ),
    price,
    ...(compareAtPrice !== undefined ? { compareAtPrice } : {}),
    rating: ratings.rating,
    reviews: ratings.reviews,
    image: featured,
    description: node.description || '',
    stock: Math.max(stock, defaultVariant.availableForSale ? 1 : 0),
    tags: tagsFromShopify(node.tags),
    variantImageOptions,
    variantImages: variantImageOptions.map((option) => option.url),
    // Shopify Files for images/mp4; keep remote video: URLs from PDP (webm, etc.).
    galleryImages: mergeProductGallery(galleryFromFiles, galleryFromPdp),
    // Hero thumbnails (Image 1) come from Shopify Media.
    carouselImages: imageUrls,
    // Published to the Storefront channel = show on Gelos. Availability is stock.
    active: true,
    shopifyProductGid: node.id,
    shopifyVariantGid: defaultVariant.id,
    handle: node.handle,
    shopifyPdpContent: pdpPartial,
  }
}

export function resolveShopifyMerchandiseId(
  product: ShopifyMappedProduct,
  variantLabel?: string,
  variantImage?: string,
): string {
  if (variantLabel || variantImage) {
    const match = product.variantImageOptions.find((option) => {
      const labelMatch =
        variantLabel &&
        option.label.toLowerCase() === variantLabel.trim().toLowerCase()
      const imageMatch =
        variantImage &&
        normalizeImageUrl(option.url) === normalizeImageUrl(variantImage)
      return Boolean(labelMatch || imageMatch)
    })
    if (match && 'shopifyVariantGid' in match && match.shopifyVariantGid) {
      return String(match.shopifyVariantGid)
    }
  }
  return product.shopifyVariantGid
}

/**
 * Prefer Shopify Files for images/mp4, and keep remote `video:` URLs from
 * custom.pdp when Shopify can't host them (e.g. WebM).
 */
function mergeProductGallery(
  fromFiles: string[],
  fromPdp: string[],
): string[] {
  if (fromFiles.length === 0) return normalizeGalleryImages(fromPdp)
  if (fromPdp.length === 0) return normalizeGalleryImages(fromFiles)

  const merged = [...fromFiles]
  const seen = new Set(fromFiles.map((entry) => entry.toLowerCase()))

  for (const entry of fromPdp) {
    if (!isGalleryVideoEntry(entry)) continue
    const key = entry.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(entry)
  }

  return normalizeGalleryImages(merged)
}
