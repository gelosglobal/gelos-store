import { collections } from '@/lib/collections'
import { bestSellerIds } from '@/lib/best-seller-meta'
import { getAllProducts } from '@/lib/db/products'
import { getStorePromotions } from '@/lib/db/store-settings'
import { newArrivalProductIds } from '@/lib/new-arrivals'
import {
  getCategoryNav,
  getProductPdpContent,
} from '@/lib/product-page-data'
import {
  filterProductsByTag,
  getEffectiveProductTags,
} from '@/lib/product-tags'
import { getProductHref } from '@/lib/product-utils'
import { stockists } from '@/lib/stockists'
import { getProductLineVariantLabel } from '@/lib/variant-display'
import type { Product } from '@/lib/types/product'

function truncate(text: string, max = 120): string {
  const trimmed = text.replace(/\s+/g, ' ').trim()
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max - 1)}…`
}

function formatProductLine(product: Product): string {
  const href = getProductHref(product)
  const tags = getEffectiveProductTags(product)
  const variant = getProductLineVariantLabel(product)
  const pdp = getProductPdpContent(product)
  const stock = product.stock > 0 ? 'in stock' : 'out of stock'
  const keyDetail =
    pdp.usageSteps?.[0]?.body ??
    pdp.detailsAccordion[0]?.content ??
    pdp.intro

  const parts = [
    product.name,
    href,
    `GH₵${product.price.toFixed(2)}`,
    product.category,
    variant,
    stock,
    `${product.rating}★`,
    tags.length ? tags.join('+') : null,
    truncate(product.description, 90),
    truncate(pdp.headline, 60),
    pdp.bullets.length ? `Benefits: ${pdp.bullets.join(', ')}` : null,
    keyDetail ? `Detail: ${truncate(keyDetail, 100)}` : null,
  ]

  return `- ${parts.filter(Boolean).join(' | ')}`
}

function formatCategoryVariants(products: Product[]): string {
  return products
    .map((p) => {
      const flavor = getProductLineVariantLabel(p) ?? p.name
      return `${flavor} → ${getProductHref(p)}`
    })
    .join('; ')
}

export async function buildGelosAiCatalogContext(): Promise<string> {
  const [products, promotions] = await Promise.all([
    getAllProducts(),
    getStorePromotions(),
  ])

  const byCategory = new Map<string, Product[]>()
  for (const product of products) {
    const list = byCategory.get(product.category) ?? []
    list.push(product)
    byCategory.set(product.category, list)
  }

  const categoryBlocks = [...byCategory.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, items]) => {
      const nav = getCategoryNav(category)
      const lines = items.map(formatProductLine).join('\n')
      const variants = formatCategoryVariants(items)
      return [
        `### ${category} (${items.length}) — ${nav.shopHref}`,
        `Variants: ${variants}`,
        lines,
      ].join('\n')
    })
    .join('\n\n')

  const bestSellerNames = bestSellerIds
    .map((id) => products.find((p) => p.id === id)?.name)
    .filter(Boolean)
    .join(', ')

  const newArrivalNames = newArrivalProductIds
    .map((id) => products.find((p) => p.id === id)?.name)
    .filter(Boolean)
    .join(', ')

  const bundles = filterProductsByTag(products, 'bundle')
  const bundleNames = bundles.map((p) => p.name).join(', ') || 'See /shop?bundles=true'

  const enabledPromos = promotions.promos.filter((p) => p.enabled)
  const promoSummary = enabledPromos.length
    ? enabledPromos.map((p) => `${p.code} (${p.discountPercent}% off)`).join(', ')
    : 'none'

  const collectionLines = collections
    .map((c) => {
      const href = c.href ?? `/shop?category=${encodeURIComponent(c.category)}`
      return `${c.title} → ${href}`
    })
    .join('; ')

  const stockistNames = stockists.map((s) => s.name).join(', ')

  const shippingLine = promotions.freeShippingEnabled
    ? `Free shipping over GH₵${promotions.freeShippingThreshold.toFixed(0)} (else GH₵${promotions.shippingFee.toFixed(0)})`
    : `Shipping GH₵${promotions.shippingFee.toFixed(0)}`

  const inStockCount = products.filter((p) => p.stock > 0).length

  return [
    '## Gelos — premium dental care (Ghana). Flavored toothpastes, foaming mouthwashes, whitening, tongue scrapers, brushes, wellness.',
    '',
    '## How to use this catalog',
    'Each product line: Name | /product/slug | GH₵price | category | variant/flavor | stock | rating | tags | description | benefits',
    'Use the Variants line under each category to compare flavors in that category.',
    '',
    `## Catalog (${products.length} products, ${inStockCount} in stock, prices in GH₵)`,
    categoryBlocks,
    '',
    '## Quick reference',
    `Best sellers: ${bestSellerNames}`,
    `New arrivals: ${newArrivalNames}`,
    `Bundles: ${bundleNames}`,
    `Collections: ${collectionLines}`,
    `Promos: ${promoSummary}. ${shippingLine}`,
    `Retail stockists: ${stockistNames}`,
    'Pages: /shop, /shop?category=Toothpaste, /shop?category=Whitening, /collections/mouth-washes, /shop?bundles=true, /shop?new-arrivals=true, /ai?tab=scan, /ai?tab=dentist, /cart, /checkout',
  ].join('\n')
}
