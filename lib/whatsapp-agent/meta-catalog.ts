import { getPublicAppUrl } from '@/lib/env'
import type { WhatsappAgentConfig } from '@/lib/whatsapp-agent/config'
import { loadWhatsappCatalogFromStore } from '@/lib/whatsapp-agent/catalog-from-store'
import type { WaCatalogProduct } from '@/lib/whatsapp-agent/types'

const BRAND = 'Gelos'

async function graphGet(
  settings: WhatsappAgentConfig['meta'],
  path: string,
  query: Record<string, string> = {},
) {
  const url = new URL(
    `https://graph.facebook.com/${settings.graphApiVersion}/${path}`,
  )
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value)
  }
  url.searchParams.set('access_token', settings.accessToken)
  const response = await fetch(url.toString(), {
    method: 'GET',
    signal: AbortSignal.timeout(30_000),
  })
  const text = await response.text()
  if (!response.ok) {
    throw new Error(`Meta Graph GET failed (${response.status}): ${text}`)
  }
  return text ? JSON.parse(text) : {}
}

async function graphPost(
  settings: WhatsappAgentConfig['meta'],
  path: string,
  body: Record<string, unknown>,
) {
  const response = await fetch(
    `https://graph.facebook.com/${settings.graphApiVersion}/${path}`,
    {
      method: 'POST',
      signal: AbortSignal.timeout(60_000),
      headers: {
        authorization: `Bearer ${settings.accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  )
  const text = await response.text()
  if (!response.ok) {
    throw new Error(`Meta Graph POST failed (${response.status}): ${text}`)
  }
  return text ? JSON.parse(text) : {}
}

function productUrl(productId: string) {
  return `${getPublicAppUrl()}/product/${encodeURIComponent(productId)}`
}

function availabilityFor(product: WaCatalogProduct) {
  if (product.stock_status === 'out_of_stock') return 'out of stock'
  if (product.stock_status === 'in_stock') return 'in stock'
  return 'available for order'
}

/** Map a Gelos WA product to a Meta Commerce PRODUCT_ITEM payload. */
export function toMetaCatalogItem(product: WaCatalogProduct) {
  if (!product.image) {
    return null
  }
  const price =
    product.price_ghs != null && Number.isFinite(product.price_ghs)
      ? `${Number(product.price_ghs).toFixed(2)} GHS`
      : null
  if (!price) return null

  return {
    id: product.id,
    title: product.name.slice(0, 200),
    description: (
      product.description ||
      `${product.name}${product.category ? ` — ${product.category}` : ''}`
    ).slice(0, 5000),
    availability: availabilityFor(product),
    condition: 'new',
    price,
    link: productUrl(product.id),
    image_link: product.image,
    brand: BRAND,
    ...(product.category
      ? { google_product_category: product.category }
      : {}),
  }
}

export function isMetaCatalogConfigured(
  settings: WhatsappAgentConfig['meta'],
) {
  return Boolean(
    settings.catalogMessagesEnabled &&
      settings.catalogId &&
      settings.accessToken,
  )
}

export async function listConnectedWabaCatalogs(
  settings: WhatsappAgentConfig['meta'],
) {
  if (!settings.wabaId) {
    throw new Error('WHATSAPP_BUSINESS_ACCOUNT_ID is required.')
  }
  const payload = await graphGet(
    settings,
    `${settings.wabaId}/product_catalogs`,
    { fields: 'id,name' },
  )
  return (payload.data || []) as Array<{ id: string; name?: string }>
}

/** Attach META_CATALOG_ID to the WABA (idempotent if already linked). */
export async function connectCatalogToWaba(
  settings: WhatsappAgentConfig['meta'],
) {
  if (!settings.catalogId) {
    throw new Error('META_CATALOG_ID is not configured.')
  }
  if (!settings.wabaId) {
    throw new Error('WHATSAPP_BUSINESS_ACCOUNT_ID is required.')
  }
  const connected = await listConnectedWabaCatalogs(settings)
  if (connected.some((c) => c.id === settings.catalogId)) {
    return { connected: true as const, alreadyLinked: true as const }
  }
  await graphPost(settings, `${settings.wabaId}/product_catalogs`, {
    catalog_id: settings.catalogId,
  })
  return { connected: true as const, alreadyLinked: false as const }
}

export async function syncStoreProductsToMetaCatalog(
  settings: WhatsappAgentConfig['meta'],
) {
  if (!settings.catalogId) {
    throw new Error('META_CATALOG_ID is not configured.')
  }

  const products = await loadWhatsappCatalogFromStore()
  const requests: Array<{ method: 'UPDATE'; data: Record<string, unknown> }> =
    []
  const skipped: Array<{ product_id: string; reason: string }> = []

  for (const product of products) {
    if (product.active === false) {
      skipped.push({ product_id: product.id, reason: 'inactive' })
      continue
    }
    const item = toMetaCatalogItem(product)
    if (!item) {
      skipped.push({
        product_id: product.id,
        reason: !product.image
          ? 'missing_public_image'
          : 'missing_price',
      })
      continue
    }
    // UPDATE upserts when the item exists; CREATE fails on duplicates.
    requests.push({ method: 'UPDATE', data: item })
  }

  if (!requests.length) {
    return {
      ok: false as const,
      synced: 0,
      skipped,
      handle: null as string | null,
      error: 'No products eligible for Meta Catalog (need price + HTTPS image).',
    }
  }

  // Meta recommends keeping batches under ~3000; Gelos catalog is small.
  const chunkSize = 500
  const handles: string[] = []
  for (let i = 0; i < requests.length; i += chunkSize) {
    const chunk = requests.slice(i, i + chunkSize)
    const result = await graphPost(
      settings,
      `${settings.catalogId}/items_batch`,
      {
        item_type: 'PRODUCT_ITEM',
        allow_upsert: true,
        requests: JSON.stringify(chunk),
      },
    )
    if (result.handle) handles.push(String(result.handle))
  }

  return {
    ok: true as const,
    synced: requests.length,
    skipped,
    handle: handles[0] || null,
    handles,
  }
}

export async function getMetaCatalogStatus(
  settings: WhatsappAgentConfig['meta'],
) {
  const configured = isMetaCatalogConfigured(settings)
  if (!configured) {
    return {
      configured: false,
      catalogId: null as string | null,
      connectedCatalogs: [] as Array<{ id: string; name?: string }>,
      productCount: null as number | null,
    }
  }

  let connectedCatalogs: Array<{ id: string; name?: string }> = []
  try {
    if (settings.wabaId) {
      connectedCatalogs = await listConnectedWabaCatalogs(settings)
    }
  } catch {
    connectedCatalogs = []
  }

  let productCount: number | null = null
  try {
    const products = await graphGet(
      settings,
      `${settings.catalogId}/products`,
      { summary: 'true', limit: '1' },
    )
    productCount =
      typeof products.summary?.total_count === 'number'
        ? products.summary.total_count
        : Array.isArray(products.data)
          ? products.data.length
          : null
  } catch {
    productCount = null
  }

  return {
    configured: true,
    catalogId: settings.catalogId,
    connectedCatalogs,
    linkedToWaba: connectedCatalogs.some((c) => c.id === settings.catalogId),
    productCount,
  }
}
