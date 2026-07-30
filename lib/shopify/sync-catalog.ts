import { getProductPdpContent } from '@/lib/product-page-data'
import type { ProductTagId } from '@/lib/product-tags'
import { getProductSlug } from '@/lib/product-utils'
import { shopifyAdminFetch } from '@/lib/shopify/admin-client'
import {
  SHOPIFY_PDP_METAFIELD_KEY,
  SHOPIFY_PDP_METAFIELD_NAMESPACE,
  serializePdpMetafieldValue,
} from '@/lib/shopify/pdp-metafield'
import {
  setShopifyProductGalleryMetafield,
  uploadGalleryFilesToShopify,
} from '@/lib/shopify/sync-gallery-files'
import { dedupeGallerySourceEntries } from '@/lib/product-gallery-images'
import { resolveProductRatings } from '@/lib/product-ratings'
import type { Product } from '@/lib/types/product'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const TAG_TO_SHOPIFY: Record<ProductTagId, string> = {
  'best-seller': 'Best Sellers',
  'new-arrival': 'New Arrivals',
  featured: 'Featured',
  bundle: 'combo',
}

export type ShopifySyncProductResult = {
  handle: string
  productGid: string | null
  status: 'updated' | 'skipped' | 'error'
  message?: string
}

type ShopifyProductNode = {
  id: string
  handle: string
  title: string
}

export type SyncGelosProductsOptions = {
  dryRun?: boolean
  /** Upload gallery URLs into Shopify Files + set custom.gallery */
  syncGallery?: boolean
  /** Optional map: handle → gallery URL entries (url or video:url) */
  gallerySources?: Record<string, string[]>
}

/**
 * Match Gelos products to existing Shopify products by handle / slug / title.
 * Updates tags, productType, description, custom.pdp, and optionally custom.gallery.
 */
export async function syncGelosProductsToShopify(
  products: Product[],
  options?: SyncGelosProductsOptions,
): Promise<ShopifySyncProductResult[]> {
  const dryRun = Boolean(options?.dryRun)
  const syncGallery = Boolean(options?.syncGallery)
  const gallerySources =
    options?.gallerySources ?? loadGallerySourcesFile()

  const shopifyProducts = await listAllShopifyAdminProducts()
  const byHandle = new Map(
    shopifyProducts.map((product) => [product.handle.toLowerCase(), product]),
  )
  const byTitle = new Map(
    shopifyProducts.map((product) => [
      product.title.trim().toLowerCase(),
      product,
    ]),
  )

  const results: ShopifySyncProductResult[] = []

  for (const product of products) {
    const handle = getProductSlug(product).toLowerCase()
    const match =
      byHandle.get(handle) ||
      byTitle.get(product.name.trim().toLowerCase()) ||
      null

    if (!match) {
      results.push({
        handle,
        productGid: null,
        status: 'skipped',
        message: 'No matching Shopify product (by handle or title)',
      })
      continue
    }

    // Always push Gelos code/admin PDP copy — ignore any existing Shopify metafield
    // so re-syncs can correct mismatched content.
    const pdp = getProductPdpContent({
      ...product,
      shopifyPdpContent: null,
    })
    const ratings = resolveProductRatings(product)
    const tags = [
      ...new Set(
        product.tags.map((tag) => TAG_TO_SHOPIFY[tag] ?? tag).filter(Boolean),
      ),
    ]
    const productType = product.category
    const galleryEntries = resolveGalleryEntries(
      handle,
      product,
      pdp.galleryImages,
      gallerySources,
    )

    if (dryRun) {
      results.push({
        handle: match.handle,
        productGid: match.id,
        status: 'updated',
        message: `dry-run → type=${productType}, tags=${tags.join('|') || '(none)'}, rating=${ratings.rating} (${ratings.reviews}), headline=${pdp.headline.slice(0, 40)}${
          syncGallery
            ? `, gallery=${galleryEntries.length || 0}`
            : ''
        }`,
      })
      continue
    }

    try {
      await updateShopifyProductBasics({
        productGid: match.id,
        descriptionHtml: buildDescriptionHtml(pdp, product.description),
        productType,
        tags,
      })

      await setShopifyProductPdpMetafield({
        productGid: match.id,
        pdpJson: serializePdpMetafieldValue(
          {
            ...pdp,
            galleryImages:
              galleryEntries.length > 0 ? galleryEntries : pdp.galleryImages,
          },
          ratings,
        ),
      })

      let galleryNote = ''
      if (syncGallery && galleryEntries.length > 0) {
        const fileGids = await uploadGalleryFilesToShopify(galleryEntries)
        await setShopifyProductGalleryMetafield({
          productGid: match.id,
          fileGids,
        })
        galleryNote = ` gallery=${fileGids.length}`
      } else if (syncGallery) {
        galleryNote = ' gallery=skipped(no source urls)'
      }

      results.push({
        handle: match.handle,
        productGid: match.id,
        status: 'updated',
        message: galleryNote || undefined,
      })
    } catch (error) {
      results.push({
        handle: match.handle,
        productGid: match.id,
        status: 'error',
        message: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return results
}

function resolveGalleryEntries(
  handle: string,
  product: Product,
  pdpGallery: string[],
  gallerySources: Record<string, string[]>,
): string[] {
  const fromManifest = gallerySources[handle]
  const raw =
    fromManifest?.length
      ? fromManifest
      : product.galleryImages?.length
        ? product.galleryImages
        : pdpGallery?.length
          ? pdpGallery
          : []
  return dedupeGallerySourceEntries(raw)
}

function loadGallerySourcesFile(): Record<string, string[]> {
  const path = join(process.cwd(), 'data', 'shopify-gallery-sources.json')
  if (!existsSync(path)) return {}
  try {
    const raw = JSON.parse(readFileSync(path, 'utf8')) as unknown
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
    const out: Record<string, string[]> = {}
    for (const [key, value] of Object.entries(raw)) {
      if (!Array.isArray(value)) continue
      const urls = value
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean)
      if (urls.length) out[key.toLowerCase()] = urls
    }
    return out
  } catch (error) {
    console.warn('[gallery-sync] Could not read data/shopify-gallery-sources.json', error)
    return {}
  }
}

async function listAllShopifyAdminProducts(): Promise<ShopifyProductNode[]> {
  const nodes: ShopifyProductNode[] = []
  let cursor: string | null = null
  let hasNextPage = true

  const query = /* GraphQL */ `
    query GelosAdminProducts($first: Int!, $after: String) {
      products(first: $first, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          handle
          title
        }
      }
    }
  `

  while (hasNextPage) {
    const data = await shopifyAdminFetch<{
      products: {
        pageInfo: { hasNextPage: boolean; endCursor: string | null }
        nodes: ShopifyProductNode[]
      }
    }>(query, { first: 100, after: cursor })

    nodes.push(...data.products.nodes)
    hasNextPage = data.products.pageInfo.hasNextPage
    cursor = data.products.pageInfo.endCursor
    if (!hasNextPage) break
  }

  return nodes
}

async function updateShopifyProductBasics(input: {
  productGid: string
  descriptionHtml?: string
  productType: string
  tags: string[]
}) {
  const mutation = /* GraphQL */ `
    mutation GelosProductUpdate($input: ProductInput!) {
      productUpdate(input: $input) {
        product {
          id
          handle
        }
        userErrors {
          field
          message
        }
      }
    }
  `

  const data = await shopifyAdminFetch<{
    productUpdate: {
      product: { id: string; handle: string } | null
      userErrors: Array<{ field?: string[] | null; message: string }>
    }
  }>(mutation, {
    input: {
      id: input.productGid,
      productType: input.productType,
      tags: input.tags,
      ...(input.descriptionHtml
        ? { descriptionHtml: input.descriptionHtml }
        : {}),
    },
  })

  if (data.productUpdate.userErrors.length) {
    throw new Error(
      data.productUpdate.userErrors.map((error) => error.message).join('; '),
    )
  }
}

async function setShopifyProductPdpMetafield(input: {
  productGid: string
  pdpJson: string
}) {
  const mutation = /* GraphQL */ `
    mutation GelosMetafieldsSet($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields {
          id
          key
        }
        userErrors {
          field
          message
        }
      }
    }
  `

  const data = await shopifyAdminFetch<{
    metafieldsSet: {
      metafields: Array<{ id: string; key: string }> | null
      userErrors: Array<{ field?: string[] | null; message: string }>
    }
  }>(mutation, {
    metafields: [
      {
        ownerId: input.productGid,
        namespace: SHOPIFY_PDP_METAFIELD_NAMESPACE,
        key: SHOPIFY_PDP_METAFIELD_KEY,
        type: 'json',
        value: input.pdpJson,
      },
    ],
  })

  if (data.metafieldsSet.userErrors.length) {
    throw new Error(
      data.metafieldsSet.userErrors.map((error) => error.message).join('; '),
    )
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Shopify product description from Gelos PDP headline / intro / bullets. */
function buildDescriptionHtml(
  pdp: { headline: string; intro: string; bullets: string[] },
  fallbackDescription?: string,
): string | undefined {
  const parts: string[] = []

  if (pdp.headline?.trim()) {
    parts.push(`<p><strong>${escapeHtml(pdp.headline.trim())}</strong></p>`)
  }
  if (pdp.intro?.trim()) {
    parts.push(`<p>${escapeHtml(pdp.intro.trim())}</p>`)
  }
  if (pdp.bullets?.length) {
    const items = pdp.bullets
      .map((bullet) => bullet.trim())
      .filter(Boolean)
      .map((bullet) => `<li>${escapeHtml(bullet)}</li>`)
      .join('')
    if (items) parts.push(`<ul>${items}</ul>`)
  }

  if (parts.length > 0) return parts.join('')

  const fallback = fallbackDescription?.trim()
  return fallback ? `<p>${escapeHtml(fallback)}</p>` : undefined
}
