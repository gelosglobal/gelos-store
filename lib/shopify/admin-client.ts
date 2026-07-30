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

export function getShopifyAdminAccessToken(): string | undefined {
  return (
    process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim() ||
    process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN?.trim() ||
    undefined
  )
}

export function isShopifyAdminConfigured(): boolean {
  return Boolean(getShopifyStoreDomain() && getShopifyAdminAccessToken())
}

type AdminGraphQlResponse<T> = {
  data?: T
  errors?: Array<{ message: string }>
}

/**
 * Shopify Admin GraphQL (write products, tags, metafields).
 * Requires a custom app Admin API token — not the Storefront token.
 */
export async function shopifyAdminFetch<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const domain = getShopifyStoreDomain()
  const token = getShopifyAdminAccessToken()

  if (!domain || !token) {
    throw new ShopifyAdminError(
      'Shopify Admin API is not configured. Set SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_ACCESS_TOKEN.',
    )
  }

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
