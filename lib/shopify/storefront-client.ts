import {
  getShopifyStoreDomain,
  getShopifyStorefrontTokenHeader,
  SHOPIFY_STOREFRONT_API_VERSION,
} from '@/lib/shopify/config'

export class ShopifyStorefrontError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly details?: unknown,
  ) {
    super(message)
    this.name = 'ShopifyStorefrontError'
  }
}

type StorefrontGraphQlResponse<T> = {
  data?: T
  errors?: Array<{ message: string }>
}

export async function shopifyStorefrontFetch<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const domain = getShopifyStoreDomain()
  const tokenHeader = getShopifyStorefrontTokenHeader()

  if (!domain || !tokenHeader) {
    throw new ShopifyStorefrontError('Shopify Storefront API is not configured')
  }

  const endpoint = `https://${domain}/api/${SHOPIFY_STOREFRONT_API_VERSION}/graphql.json`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      [tokenHeader.name]: tokenHeader.value,
    },
    body: JSON.stringify({ query, variables }),
    // Catalog changes (draft → active) should show up quickly on the storefront.
    cache: 'no-store',
  })

  const json = (await response.json()) as StorefrontGraphQlResponse<T>

  if (!response.ok) {
    throw new ShopifyStorefrontError(
      `Shopify Storefront request failed (${response.status})`,
      response.status,
      json,
    )
  }

  if (json.errors?.length) {
    throw new ShopifyStorefrontError(
      json.errors.map((error) => error.message).join('; '),
      response.status,
      json.errors,
    )
  }

  if (!json.data) {
    throw new ShopifyStorefrontError('Shopify Storefront returned no data')
  }

  return json.data
}
