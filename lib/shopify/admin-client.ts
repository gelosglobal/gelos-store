import {
  getShopifyStoreDomain,
  SHOPIFY_STOREFRONT_API_VERSION,
} from '@/lib/shopify/config'

export class ShopifyAdminError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly details?: unknown,
  ) {
    super(message)
    this.name = 'ShopifyAdminError'
  }
}

type CachedAdminToken = {
  token: string
  expiresAt: number
}

let cachedAdminToken: CachedAdminToken | null = null

export function getShopifyAdminAccessToken(): string | undefined {
  return (
    process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim() ||
    process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN?.trim() ||
    undefined
  )
}

function getShopifyAppClientId(): string | undefined {
  return (
    process.env.SHOPIFY_CLIENT_ID?.trim() ||
    process.env.SHOPIFY_APP_CLIENT_ID?.trim() ||
    undefined
  )
}

function getShopifyAppClientSecret(): string | undefined {
  return (
    process.env.SHOPIFY_CLIENT_SECRET?.trim() ||
    process.env.SHOPIFY_APP_CLIENT_SECRET?.trim() ||
    undefined
  )
}

export function isShopifyAdminConfigured(): boolean {
  const domain = getShopifyStoreDomain()
  if (!domain) return false
  if (getShopifyAdminAccessToken()) return true
  return Boolean(getShopifyAppClientId() && getShopifyAppClientSecret())
}

async function getClientCredentialsToken(domain: string): Promise<string> {
  const clientId = getShopifyAppClientId()
  const clientSecret = getShopifyAppClientSecret()
  if (!clientId || !clientSecret) {
    throw new ShopifyAdminError(
      'Shopify Admin API is not configured. Set SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET from Dev Dashboard → Settings.',
    )
  }

  if (cachedAdminToken && Date.now() < cachedAdminToken.expiresAt - 60_000) {
    return cachedAdminToken.token
  }

  const response = await fetch(`https://${domain}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
    cache: 'no-store',
  })

  const json = (await response.json()) as {
    access_token?: string
    expires_in?: number
    scope?: string
    error?: string
    error_description?: string
  }

  if (!response.ok || !json.access_token) {
    throw new ShopifyAdminError(
      json.error_description ||
        json.error ||
        `Shopify client-credentials token request failed (${response.status})`,
      response.status,
      json,
    )
  }

  const expiresInMs = Math.max(60, json.expires_in ?? 86399) * 1000
  cachedAdminToken = {
    token: json.access_token,
    expiresAt: Date.now() + expiresInMs,
  }
  return json.access_token
}

async function resolveShopifyAdminToken(domain: string): Promise<string> {
  if (getShopifyAppClientId() && getShopifyAppClientSecret()) {
    return getClientCredentialsToken(domain)
  }

  const staticToken = getShopifyAdminAccessToken()
  if (staticToken) return staticToken

  throw new ShopifyAdminError(
    'Shopify Admin API is not configured. Set SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET from Dev Dashboard → Settings.',
  )
}

type AdminGraphQlResponse<T> = {
  data?: T
  errors?: Array<{ message: string }>
}

/**
 * Shopify Admin GraphQL (write products, tags, metafields, discounts).
 * Prefers Dev Dashboard client credentials (24h rotating tokens).
 */
export async function shopifyAdminFetch<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const domain = getShopifyStoreDomain()

  if (!domain) {
    throw new ShopifyAdminError(
      'Shopify Admin API is not configured. Set SHOPIFY_STORE_DOMAIN.',
    )
  }

  const token = await resolveShopifyAdminToken(domain)
  const version =
    process.env.SHOPIFY_ADMIN_API_VERSION?.trim() ||
    SHOPIFY_STOREFRONT_API_VERSION
  const endpoint = `https://${domain}/admin/api/${version}/graphql.json`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token,
    },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  })

  const json = (await response.json()) as AdminGraphQlResponse<T>

  if (!response.ok) {
    throw new ShopifyAdminError(
      `Shopify Admin request failed (${response.status})`,
      response.status,
      json,
    )
  }

  if (json.errors?.length) {
    throw new ShopifyAdminError(
      json.errors.map((error) => error.message).join('; '),
      response.status,
      json.errors,
    )
  }

  if (!json.data) {
    throw new ShopifyAdminError('Shopify Admin returned no data')
  }

  return json.data
}
