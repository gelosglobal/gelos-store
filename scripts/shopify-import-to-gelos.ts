/**
 * One-time Shopify → Gelos import (products, stock, percent promo codes).
 *
 * Usage:
 *   pnpm shopify:import-to-gelos          # dry run
 *   pnpm shopify:import-to-gelos -- --apply
 */
import {
  isShopifyAdminConfigured,
  shopifyAdminFetch,
} from '@/lib/shopify/admin-client'
import { prisma } from '@/lib/prisma'
import { getProductSlug } from '@/lib/product-utils'
import { normalizeImageUrl } from '@/lib/image-url'
import { normalizeProductTags, type ProductTagId } from '@/lib/product-tags'
import { normalizeGalleryImages } from '@/lib/product-gallery-images'
import {
  LEGACY_BUNDLE_PRODUCT_TO_HANDLE,
  SHOPIFY_PRODUCT_ID_TO_HANDLE,
} from '@/lib/product-bundle-id-map'
import {
  getStorePromotions,
  updateStorePromotions,
} from '@/lib/db/store-settings'
import type { PromoCode } from '@/lib/store-promotions'

const APPLY = process.argv.includes('--apply')

type ShopifyProductNode = {
  id: string
  title: string
  handle: string
  status: string
  descriptionHtml?: string | null
  productType?: string | null
  tags: string[]
  featuredImage?: { url: string } | null
  images: { nodes: Array<{ url: string }> }
  variants: {
    nodes: Array<{
      id: string
      title: string
      price: string
      inventoryQuantity?: number | null
      image?: { url: string } | null
    }>
  }
}

type ShopifyProductsPage = {
  products: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null }
    nodes: ShopifyProductNode[]
  }
}

type CodeDiscountNodesPage = {
  codeDiscountNodes: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null }
    nodes: Array<{
      id: string
      codeDiscount:
        | {
            __typename: string
            title?: string
            status?: string
            codes?: { nodes: Array<{ code: string }> }
            customerGets?: {
              value?:
                | { __typename: 'DiscountPercentage'; percentage: number }
                | {
                    __typename: 'DiscountAmount'
                    amount: { amount: string }
                  }
                | null
            }
          }
        | null
    }>
  }
}

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
}

const SHOPIFY_CATEGORY_ALIASES: Record<string, string> = {
  toothpaste: 'Toothpaste',
  toothpastes: 'Toothpaste',
  toothbrush: 'Toothbrushes',
  toothbrushes: 'Toothbrushes',
  whitening: 'Whitening',
  'teeth whitening': 'Whitening',
  'tongue scraper': 'Tongue Scraper',
  mouthwash: 'Mouthwash',
  'mouth wash': 'Mouthwash',
  'mouth spray': 'Mouthwash',
  wellness: 'Wellness',
  'water flosser': 'Water Flossers',
  'water flossers': 'Water Flossers',
  accessories: 'Accessories',
  tools: 'Tools',
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function shopifyNumericId(gid: string): string {
  return gid.split('/').pop() || gid
}

function mapCategory(productType: string | null | undefined, title: string, handle: string) {
  const raw = productType?.trim() ?? ''
  if (raw) {
    const alias = SHOPIFY_CATEGORY_ALIASES[raw.toLowerCase()]
    if (alias) return alias
  }
  const haystack = `${title} ${handle}`.toLowerCase()
  if (/water\s*flosser/.test(haystack)) return 'Water Flossers'
  if (/mouth\s*(wash|spray)|foaming\s*mouth/.test(haystack)) return 'Mouthwash'
  if (/pulling\s*oil|enamel\s*care|hyaluronic|inhaler|serum|nasal/.test(haystack)) {
    return 'Wellness'
  }
  if (/tongue\s*scraper/.test(haystack)) return 'Tongue Scraper'
  if (/whiten|v34|pap\+|charcoal/.test(haystack)) return 'Whitening'
  if (/toothbrush|brush\s*heads?/.test(haystack)) return 'Toothbrushes'
  if (/tooth\s*paste|toothpaste|toothapaste/.test(haystack)) return 'Toothpaste'
  if (/floss/.test(haystack)) return 'Tools'
  return raw || 'General'
}

function mapTags(tags: string[]): ProductTagId[] {
  return normalizeProductTags(
    tags.map((tag) => {
      const key = tag.trim().toLowerCase().replace(/\s+/g, '-')
      return SHOPIFY_TAG_ALIASES[key] ?? key
    }),
  )
}

function totalStock(node: ShopifyProductNode): number {
  return node.variants.nodes.reduce(
    (sum, variant) => sum + Math.max(0, variant.inventoryQuantity ?? 0),
    0,
  )
}

function primaryPrice(node: ShopifyProductNode): number {
  const prices = node.variants.nodes
    .map((variant) => Number.parseFloat(variant.price))
    .filter((price) => Number.isFinite(price) && price > 0)
  return prices.length ? Math.min(...prices) : 0
}

function buildHandleToLegacyId(): Map<string, string> {
  const map = new Map<string, string>()
  for (const [legacyId, handle] of Object.entries(LEGACY_BUNDLE_PRODUCT_TO_HANDLE)) {
    if (!/^\d+$/.test(legacyId)) continue
    map.set(handle.toLowerCase(), legacyId)
  }
  for (const [shopifyId, handle] of Object.entries(SHOPIFY_PRODUCT_ID_TO_HANDLE)) {
    const legacy = map.get(handle)
    if (legacy) continue
    void shopifyId
  }
  return map
}

async function fetchAllShopifyProducts(): Promise<ShopifyProductNode[]> {
  const products: ShopifyProductNode[] = []
  let cursor: string | null = null

  for (;;) {
    const data: ShopifyProductsPage = await shopifyAdminFetch<ShopifyProductsPage>(
      `#graphql
      query GelosImportProducts($cursor: String) {
        products(first: 50, after: $cursor) {
          pageInfo { hasNextPage endCursor }
          nodes {
            id
            title
            handle
            status
            descriptionHtml
            productType
            tags
            featuredImage { url }
            images(first: 12) { nodes { url } }
            variants(first: 50) {
              nodes {
                id
                title
                price
                inventoryQuantity
                image { url }
              }
            }
          }
        }
      }`,
      { cursor },
    )

    products.push(...data.products.nodes)
    if (!data.products.pageInfo.hasNextPage) break
    cursor = data.products.pageInfo.endCursor
  }

  return products
}

async function fetchPercentDiscountCodes(): Promise<
  Array<{ code: string; percent: number; title: string; status: string }>
> {
  const out: Array<{
    code: string
    percent: number
    title: string
    status: string
  }> = []
  let cursor: string | null = null

  try {
    for (;;) {
      const data = await shopifyAdminFetch<CodeDiscountNodesPage>(
        `#graphql
        query GelosImportDiscounts($cursor: String) {
          codeDiscountNodes(first: 50, after: $cursor) {
            pageInfo { hasNextPage endCursor }
            nodes {
              id
              codeDiscount {
                __typename
                ... on DiscountCodeBasic {
                  title
                  status
                  codes(first: 20) { nodes { code } }
                  customerGets {
                    value {
                      __typename
                      ... on DiscountPercentage { percentage }
                    }
                  }
                }
                ... on DiscountCodeBxgy {
                  title
                  status
                }
                ... on DiscountCodeFreeShipping {
                  title
                  status
                }
              }
            }
          }
        }`,
        { cursor },
      )

      for (const node of data.codeDiscountNodes.nodes) {
        const discount = node.codeDiscount
        if (!discount || discount.__typename !== 'DiscountCodeBasic') continue
        const value = discount.customerGets?.value
        if (!value || value.__typename !== 'DiscountPercentage') continue
        const percent = Math.round(value.percentage * 100)
        if (!Number.isFinite(percent) || percent <= 0) continue
        for (const codeNode of discount.codes?.nodes ?? []) {
          const code = codeNode.code?.trim().toUpperCase()
          if (!code) continue
          out.push({
            code,
            percent,
            title: discount.title || code,
            status: discount.status || 'ACTIVE',
          })
        }
      }

      if (!data.codeDiscountNodes.pageInfo.hasNextPage) break
      cursor = data.codeDiscountNodes.pageInfo.endCursor
    }
  } catch (error) {
    console.warn(
      'Discount import skipped (token may lack discount read scope):',
      error instanceof Error ? error.message : error,
    )
  }

  return out
}

function uniqueSlug(base: string, used: Set<string>): string {
  let slug = base || 'product'
  let n = 2
  while (used.has(slug)) {
    slug = `${base}-${n}`
    n += 1
  }
  used.add(slug)
  return slug
}

async function main() {
  if (!isShopifyAdminConfigured()) {
    throw new Error('Shopify Admin API is not configured')
  }

  console.log(APPLY ? '=== APPLY import ===' : '=== DRY RUN (pass --apply to write) ===')

  const [shopifyProducts, gelosProducts, discountCodes] = await Promise.all([
    fetchAllShopifyProducts(),
    prisma.product.findMany(),
    fetchPercentDiscountCodes(),
  ])

  const byId = new Map(gelosProducts.map((p) => [p.productId, p]))
  const bySlug = new Map(gelosProducts.map((p) => [p.slug.toLowerCase(), p]))
  const byName = new Map(
    gelosProducts.map((p) => [normalizeName(p.name), p]),
  )
  const handleToLegacy = buildHandleToLegacyId()
  const usedSlugs = new Set(gelosProducts.map((p) => p.slug.toLowerCase()))
  const numericIds = gelosProducts
    .map((p) => Number.parseInt(p.productId, 10))
    .filter((n) => Number.isFinite(n))
  let nextId = (numericIds.length ? Math.max(...numericIds) : 0) + 1

  type Plan =
    | {
        action: 'create'
        productId: string
        shopifyId: string
        handle: string
        title: string
        payload: {
          productId: string
          slug: string
          name: string
          category: string
          price: number
          stock: number
          description: string
          image: string
          galleryImages: string[]
          tags: ProductTagId[]
          active: boolean
          rating: number
          reviews: number
          variantImages: string[]
          variantImageOptions: unknown[]
          carouselImages: string[]
        }
      }
    | {
        action: 'update-stock'
        productId: string
        shopifyId: string
        handle: string
        title: string
        from: number
        to: number
        price?: number
      }
    | {
        action: 'skip'
        shopifyId: string
        handle: string
        title: string
        reason: string
      }

  const plans: Plan[] = []
  const claimedGelosIds = new Set<string>()

  for (const node of shopifyProducts) {
    const handle = node.handle.toLowerCase()
    const shopifyId = shopifyNumericId(node.id)
    const stock = totalStock(node)
    const price = primaryPrice(node)
    const image =
      node.featuredImage?.url ||
      node.images.nodes[0]?.url ||
      node.variants.nodes.find((v) => v.image?.url)?.image?.url ||
      ''
    const galleryImages = normalizeGalleryImages(
      node.images.nodes.map((img) => img.url).filter(Boolean),
    )
    const tags = mapTags(node.tags)
    const active = node.status === 'ACTIVE'
    const description = stripHtml(node.descriptionHtml || '') || node.title
    const category = mapCategory(node.productType, node.title, handle)

    // Match existing Gelos product
    const legacyId = handleToLegacy.get(handle)
    const matched =
      (legacyId && byId.get(legacyId)) ||
      bySlug.get(handle) ||
      byName.get(normalizeName(node.title)) ||
      null

    if (matched) {
      if (claimedGelosIds.has(matched.productId)) {
        plans.push({
          action: 'skip',
          shopifyId,
          handle,
          title: node.title,
          reason: `duplicate Shopify row for Gelos ${matched.productId}`,
        })
        continue
      }
      claimedGelosIds.add(matched.productId)

      if (matched.stock === stock && (!price || matched.price === price)) {
        plans.push({
          action: 'skip',
          shopifyId,
          handle,
          title: node.title,
          reason: `already matched as ${matched.productId} (stock/price unchanged)`,
        })
        continue
      }
      plans.push({
        action: 'update-stock',
        productId: matched.productId,
        shopifyId,
        handle,
        title: node.title,
        from: matched.stock,
        to: stock,
        price: price > 0 && price !== matched.price ? price : undefined,
      })
      continue
    }

    if (node.status !== 'ACTIVE') {
      plans.push({
        action: 'skip',
        shopifyId,
        handle,
        title: node.title,
        reason: `${node.status.toLowerCase()} — not importing new drafts/archived`,
      })
      continue
    }

    // Skip Shopify placeholder / bundle shells that aren't real Gelos SKUs
    if (
      !price ||
      price < 1 ||
      /^untitled/i.test(node.title) ||
      /gelos-bundles|combo-pack|classic-combo|tooth-paste$|sdcd-/i.test(handle)
    ) {
      plans.push({
        action: 'skip',
        shopifyId,
        handle,
        title: node.title,
        reason: 'skipped placeholder/bundle shell (price < 1 or junk handle)',
      })
      continue
    }

    // Prefer restoring known legacy id when that slot is free
    let productId = legacyId && !byId.has(legacyId) ? legacyId : String(nextId++)
    while (byId.has(productId)) {
      productId = String(nextId++)
    }

    const slug = uniqueSlug(getProductSlug({ name: node.title }) || handle, usedSlugs)

    plans.push({
      action: 'create',
      productId,
      shopifyId,
      handle,
      title: node.title,
      payload: {
        productId,
        slug,
        name: node.title.trim(),
        category,
        price,
        stock,
        description,
        image: normalizeImageUrl(image),
        galleryImages,
        tags,
        active,
        rating: 4.8,
        reviews: 0,
        variantImages: [],
        variantImageOptions: [],
        carouselImages: [],
      },
    })
    byId.set(productId, {
      productId,
      slug,
      name: node.title,
      stock,
      price,
    } as (typeof gelosProducts)[number])
  }

  const creates = plans.filter((p) => p.action === 'create')
  const updates = plans.filter((p) => p.action === 'update-stock')
  const skips = plans.filter((p) => p.action === 'skip')

  console.log(`\nShopify products: ${shopifyProducts.length}`)
  console.log(`Gelos products:   ${gelosProducts.length}`)
  console.log(`Create: ${creates.length} | Update stock/price: ${updates.length} | Skip: ${skips.length}`)

  console.log('\n--- CREATE ---')
  for (const plan of creates) {
    if (plan.action !== 'create') continue
    console.log(
      `+ ${plan.productId} ← ${plan.handle} | ${plan.title} | GH₵${plan.payload.price} | stock ${plan.payload.stock} | ${plan.payload.category}${plan.payload.active ? '' : ' (draft)'}`,
    )
  }

  console.log('\n--- UPDATE STOCK/PRICE ---')
  for (const plan of updates) {
    if (plan.action !== 'update-stock') continue
    console.log(
      `~ ${plan.productId} ← ${plan.handle} | stock ${plan.from}→${plan.to}${
        plan.price != null ? ` | price→GH₵${plan.price}` : ''
      }`,
    )
  }

  console.log('\n--- DISCOUNTS (percent codes) ---')
  const existingPromos = await getStorePromotions()
  const existingCodes = new Set(
    existingPromos.promos.map((p) => p.code.trim().toUpperCase()),
  )
  const newPromos: PromoCode[] = []
  for (const discount of discountCodes) {
    if (existingCodes.has(discount.code)) {
      console.log(`= keep ${discount.code} (${discount.percent}%) — already in Gelos`)
      continue
    }
    if (discount.status !== 'ACTIVE') {
      console.log(`- skip ${discount.code} — Shopify status ${discount.status}`)
      continue
    }
    if (/goaffpro|affiliate/i.test(discount.title)) {
      console.log(`- skip ${discount.code} — affiliate code (${discount.title})`)
      continue
    }
    newPromos.push({
      id: `shopify-${discount.code.toLowerCase()}`,
      code: discount.code,
      discountPercent: discount.percent,
      enabled: true,
      label: `${discount.percent}% off`,
    })
    console.log(`+ add ${discount.code} (${discount.percent}%) — ${discount.title}`)
  }
  if (discountCodes.length === 0) {
    console.log('(none found or discount scope unavailable)')
  }

  if (!APPLY) {
    console.log('\nDry run only. Re-run with --apply to write to Mongo.')
    await prisma.$disconnect()
    return
  }

  for (const plan of creates) {
    if (plan.action !== 'create') continue
    await prisma.product.create({
      data: {
        ...plan.payload,
        tags: plan.payload.tags,
        variantImageOptions: plan.payload.variantImageOptions as object[],
      },
    })
  }

  for (const plan of updates) {
    if (plan.action !== 'update-stock') continue
    await prisma.product.update({
      where: { productId: plan.productId },
      data: {
        stock: plan.to,
        ...(plan.price != null ? { price: plan.price } : {}),
      },
    })
  }

  if (newPromos.length > 0) {
    await updateStorePromotions({
      ...existingPromos,
      promos: [...existingPromos.promos, ...newPromos],
    })
  }

  const total = await prisma.product.count()
  console.log(`\nDone. Gelos products now: ${total}`)
  console.log(`Created ${creates.length}, updated ${updates.length}, promos added ${newPromos.length}`)
  await prisma.$disconnect()
}

main().catch(async (error) => {
  console.error(error)
  await prisma.$disconnect().catch(() => undefined)
  process.exit(1)
})
