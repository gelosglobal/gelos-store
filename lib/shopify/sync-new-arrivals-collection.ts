import { saveTagCollectionOrder } from '@/lib/db/tag-collections'
import { isDatabaseConfigured } from '@/lib/env'
import {
  isShopifyAdminConfigured,
  shopifyAdminFetch,
} from '@/lib/shopify/admin-client'
import { isShopifyCatalogEnabled } from '@/lib/shopify/config'
import { shopifyStorefrontFetch } from '@/lib/shopify/storefront-client'

export const DEFAULT_NEW_ARRIVALS_COLLECTION_ID = '304713334983'

type CollectionProductsPage = {
  title: string
  handle: string
  productIds: string[]
  handles: string[]
}

type StorefrontCollectionData = {
  collection: {
    id: string
    title: string
    handle: string
    products: {
      pageInfo: { hasNextPage: boolean; endCursor: string | null }
      nodes: Array<{ id: string; handle: string; title: string }>
    }
  } | null
}

type AdminCollectionData = {
  collection: {
    id: string
    title: string
    handle: string
    products: {
      pageInfo: { hasNextPage: boolean; endCursor: string | null }
      nodes: Array<{
        id: string
        handle: string
        title: string
        status: string
      }>
    }
  } | null
}

function toNumericId(gid: string): string {
  const parts = gid.split('/')
  return parts[parts.length - 1] || gid
}

function collectionGid(raw: string): string {
  const trimmed = raw.trim()
  if (trimmed.startsWith('gid://')) return trimmed
  return `gid://shopify/Collection/${trimmed}`
}

async function fetchViaStorefront(
  collectionId: string,
): Promise<CollectionProductsPage> {
  const productIds: string[] = []
  const handles: string[] = []
  let cursor: string | null = null
  let title = ''
  let handle = ''

  do {
    const data = await shopifyStorefrontFetch<StorefrontCollectionData>(
      /* GraphQL */ `
        query GelosNewArrivalsCollection($id: ID!, $cursor: String) {
          collection(id: $id) {
            id
            title
            handle
            products(first: 100, after: $cursor, sortKey: MANUAL) {
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
        }
      `,
      { id: collectionId, cursor },
    )

    const collection = data.collection
    if (!collection) {
      throw new Error(`Shopify collection not found: ${collectionId}`)
    }

    title = collection.title
    handle = collection.handle

    for (const node of collection.products.nodes) {
      const id = toNumericId(node.id)
      if (!id || productIds.includes(id)) continue
      productIds.push(id)
      handles.push(node.handle)
    }

    cursor = collection.products.pageInfo.hasNextPage
      ? collection.products.pageInfo.endCursor
      : null
  } while (cursor)

  return { title, handle, productIds, handles }
}

async function fetchViaAdmin(
  collectionId: string,
): Promise<CollectionProductsPage> {
  const productIds: string[] = []
  const handles: string[] = []
  let cursor: string | null = null
  let title = ''
  let handle = ''

  do {
    const data = await shopifyAdminFetch<AdminCollectionData>(
      /* GraphQL */ `
        query GelosNewArrivalsCollectionAdmin($id: ID!, $cursor: String) {
          collection(id: $id) {
            id
            title
            handle
            products(first: 100, after: $cursor, sortKey: MANUAL) {
              pageInfo {
                hasNextPage
                endCursor
              }
              nodes {
                id
                handle
                title
                status
              }
            }
          }
        }
      `,
      { id: collectionId, cursor },
    )

    const collection = data.collection
    if (!collection) {
      throw new Error(`Shopify collection not found: ${collectionId}`)
    }

    title = collection.title
    handle = collection.handle

    for (const node of collection.products.nodes) {
      const id = toNumericId(node.id)
      if (!id || productIds.includes(id)) continue
      productIds.push(id)
      handles.push(node.handle)
    }

    cursor = collection.products.pageInfo.hasNextPage
      ? collection.products.pageInfo.endCursor
      : null
  } while (cursor)

  return { title, handle, productIds, handles }
}

/**
 * Fetch Shopify collection products in manual sort order.
 * Prefers Storefront API (usually configured); falls back to Admin API.
 */
export async function fetchShopifyCollectionProductIds(
  collectionIdOrGid: string = DEFAULT_NEW_ARRIVALS_COLLECTION_ID,
): Promise<{
  collectionTitle: string
  collectionHandle: string
  productIds: string[]
  handles: string[]
  source: 'storefront' | 'admin'
}> {
  const collectionId = collectionGid(collectionIdOrGid)

  if (isShopifyCatalogEnabled()) {
    try {
      const page = await fetchViaStorefront(collectionId)
      return {
        collectionTitle: page.title,
        collectionHandle: page.handle,
        productIds: page.productIds,
        handles: page.handles,
        source: 'storefront',
      }
    } catch (error) {
      if (!isShopifyAdminConfigured()) throw error
      console.warn(
        '[sync-new-arrivals] Storefront fetch failed, trying Admin API…',
        error instanceof Error ? error.message : error,
      )
    }
  }

  if (!isShopifyAdminConfigured()) {
    throw new Error(
      'Shopify is not configured. Set storefront or admin credentials.',
    )
  }

  const page = await fetchViaAdmin(collectionId)
  return {
    collectionTitle: page.title,
    collectionHandle: page.handle,
    productIds: page.productIds,
    handles: page.handles,
    source: 'admin',
  }
}

/**
 * Pull Shopify New Arrivals collection order into Gelos tag collection `new-arrival`.
 */
export async function syncNewArrivalsFromShopifyCollection(
  collectionIdOrGid: string = DEFAULT_NEW_ARRIVALS_COLLECTION_ID,
): Promise<{
  collectionTitle: string
  productIds: string[]
  handles: string[]
  source: 'storefront' | 'admin'
}> {
  if (!isDatabaseConfigured()) {
    throw new Error('DATABASE_URL is not configured')
  }

  const fetched = await fetchShopifyCollectionProductIds(collectionIdOrGid)
  if (fetched.productIds.length === 0) {
    throw new Error(
      `Collection "${fetched.collectionTitle}" has no products to sync`,
    )
  }

  await saveTagCollectionOrder('new-arrival', fetched.productIds)

  return {
    collectionTitle: fetched.collectionTitle,
    productIds: fetched.productIds,
    handles: fetched.handles,
    source: fetched.source,
  }
}
