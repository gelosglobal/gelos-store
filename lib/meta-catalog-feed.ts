import type { Product } from '@/lib/types/product'
import { getAppUrl } from '@/lib/env'
import { convertFromBase } from '@/lib/exchange-rates'
import { normalizeImageUrl } from '@/lib/image-url'
import { getProductHref, isProductPublished } from '@/lib/product-utils'
import { getAbsoluteAssetUrl } from '@/lib/storefront-url'

export type MetaCatalogFormat = 'csv' | 'tsv' | 'xml'

export type MetaCatalogCurrency = 'GHS' | 'USD' | 'NGN'

/** Meta Commerce Manager product feed row (required + useful optional fields). */
export type MetaCatalogItem = {
  id: string
  title: string
  description: string
  availability: 'in stock' | 'out of stock'
  condition: 'new'
  price: string
  link: string
  image_link: string
  brand: string
  additional_image_link: string
  product_type: string
  google_product_category: string
  inventory: string
  status: 'active' | 'archived'
}

const META_FEED_COLUMNS: (keyof MetaCatalogItem)[] = [
  'id',
  'title',
  'description',
  'availability',
  'condition',
  'price',
  'link',
  'image_link',
  'brand',
  'additional_image_link',
  'product_type',
  'google_product_category',
  'inventory',
  'status',
]

const GOOGLE_CATEGORY_BY_PRODUCT_TYPE: Record<string, string> = {
  Toothpaste: 'Health & Beauty > Personal Care > Oral Care > Toothpaste',
  Toothbrushes: 'Health & Beauty > Personal Care > Oral Care > Toothbrushes',
  Whitening: 'Health & Beauty > Personal Care > Oral Care',
  Accessories: 'Health & Beauty > Personal Care > Oral Care',
  Wellness: 'Health & Beauty > Personal Care > Oral Care',
  Bundles: 'Health & Beauty > Personal Care > Oral Care',
}

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value
  return `${value.slice(0, max - 1).trimEnd()}…`
}

function formatMetaPrice(amountInGhs: number, currency: MetaCatalogCurrency): string {
  const localized =
    currency === 'GHS' ? amountInGhs : convertFromBase(amountInGhs, currency)
  return `${localized.toFixed(2)} ${currency}`
}

function isLikelyImageUrl(url: string): boolean {
  const lower = url.toLowerCase()
  if (!lower.startsWith('http://') && !lower.startsWith('https://')) return false
  if (lower.includes('video:')) return false
  if (/\.(mp4|webm|mov|m4v)(\?|$)/i.test(lower)) return false
  return true
}

function collectAdditionalImages(product: Product, primaryImage: string): string[] {
  const seen = new Set([primaryImage])
  const urls: string[] = []

  const candidates = [
    ...product.carouselImages,
    ...product.galleryImages,
    ...product.variantImages,
    ...product.variantImageOptions.map((option) => option.url),
  ]

  for (const candidate of candidates) {
    const absolute = getAbsoluteAssetUrl(normalizeImageUrl(candidate))
    if (
      !absolute ||
      absolute.includes('placeholder.svg') ||
      !isLikelyImageUrl(absolute) ||
      seen.has(absolute)
    ) {
      continue
    }
    seen.add(absolute)
    urls.push(absolute)
    if (urls.length >= 10) break
  }

  return urls
}

export function productToMetaCatalogItem(
  product: Product,
  options?: {
    currency?: MetaCatalogCurrency
    brand?: string
  },
): MetaCatalogItem {
  const currency = options?.currency ?? 'GHS'
  const brand = options?.brand ?? 'Gelos'
  const description = truncate(stripHtml(product.description || product.name), 9999)
  const primaryImage = getAbsoluteAssetUrl(normalizeImageUrl(product.image))
  const additional = collectAdditionalImages(product, primaryImage)
  const inStock = product.stock > 0 && isProductPublished(product)

  return {
    id: product.id,
    title: truncate(product.name.trim(), 200),
    description: description || product.name,
    availability: inStock ? 'in stock' : 'out of stock',
    condition: 'new',
    price: formatMetaPrice(product.price, currency),
    link: `${getAppUrl()}${getProductHref(product)}`,
    image_link: isLikelyImageUrl(primaryImage) ? primaryImage : '',
    brand,
    additional_image_link: additional.join(','),
    product_type: product.category,
    google_product_category:
      GOOGLE_CATEGORY_BY_PRODUCT_TYPE[product.category] ??
      'Health & Beauty > Personal Care > Oral Care',
    inventory: String(Math.max(0, product.stock)),
    status: isProductPublished(product) ? 'active' : 'archived',
  }
}

export function buildMetaCatalogItems(
  products: Product[],
  options?: {
    currency?: MetaCatalogCurrency
    brand?: string
    includeDrafts?: boolean
  },
): MetaCatalogItem[] {
  const includeDrafts = options?.includeDrafts === true
  return products
    .filter((product) => includeDrafts || isProductPublished(product))
    .map((product) => productToMetaCatalogItem(product, options))
    .filter((item) => Boolean(item.image_link))
}

function escapeDelimitedField(value: string, delimiter: ',' | '\t'): string {
  const needsQuotes =
    delimiter === ','
      ? /[",\n\r]/.test(value)
      : /["\n\r]/.test(value) || value.includes('\t')

  if (!needsQuotes) return value
  return `"${value.replace(/"/g, '""')}"`
}

export function serializeMetaCatalogDelimited(
  items: MetaCatalogItem[],
  delimiter: ',' | '\t',
): string {
  const header = META_FEED_COLUMNS.join(delimiter)
  const rows = items.map((item) =>
    META_FEED_COLUMNS.map((column) =>
      escapeDelimitedField(item[column] ?? '', delimiter),
    ).join(delimiter),
  )
  return [header, ...rows].join('\n')
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function serializeMetaCatalogXml(items: MetaCatalogItem[]): string {
  const entries = items
    .map((item) => {
      const fields = META_FEED_COLUMNS.map(
        (column) =>
          `      <g:${column}>${escapeXml(item[column] ?? '')}</g:${column}>`,
      ).join('\n')

      return `    <item>\n${fields}\n    </item>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Gelos Product Catalog</title>
    <link>${escapeXml(getAppUrl())}</link>
    <description>Gelos product feed for Meta Advantage+ catalog ads</description>
${entries}
  </channel>
</rss>
`
}

export function serializeMetaCatalogFeed(
  items: MetaCatalogItem[],
  format: MetaCatalogFormat,
): string {
  if (format === 'xml') return serializeMetaCatalogXml(items)
  if (format === 'tsv') return serializeMetaCatalogDelimited(items, '\t')
  return serializeMetaCatalogDelimited(items, ',')
}

export function getMetaCatalogContentType(format: MetaCatalogFormat): string {
  if (format === 'xml') return 'application/xml; charset=utf-8'
  if (format === 'tsv') return 'text/tab-separated-values; charset=utf-8'
  return 'text/csv; charset=utf-8'
}

export function getMetaCatalogFilename(format: MetaCatalogFormat): string {
  return `gelos-meta-catalog.${format}`
}

export function parseMetaCatalogFormat(value: string | null): MetaCatalogFormat {
  const normalized = value?.trim().toLowerCase()
  if (normalized === 'tsv' || normalized === 'xml' || normalized === 'csv') {
    return normalized
  }
  return 'csv'
}

export function parseMetaCatalogCurrency(
  value: string | null,
): MetaCatalogCurrency {
  const normalized = value?.trim().toUpperCase()
  if (normalized === 'USD' || normalized === 'NGN' || normalized === 'GHS') {
    return normalized
  }
  return 'GHS'
}
