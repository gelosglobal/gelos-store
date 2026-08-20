/**
 * Shopify Storefront API — commerce backend for the hybrid Gelos storefront.
 * When configured, catalog + checkout come from Shopify; UI stays in Next.js.
 */

export function getShopifyStoreDomain(): string | undefined {
  const raw =
    process.env.SHOPIFY_STORE_DOMAIN?.trim() ||
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN?.trim()
  if (!raw) return undefined
  return raw
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '')
    .toLowerCase()
}

export function getShopifyStorefrontToken(): string | undefined {
  return (
    process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN?.trim() ||
    process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN?.trim() ||
    process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN?.trim() ||
    undefined
  )
}

/**
 * Headless channel private tokens must use Shopify-Storefront-Private-Token.
 * Public / classic custom-app tokens use X-Shopify-Storefront-Access-Token.
 *
 * Default is private (recommended for this Next.js server setup).
 * Set SHOPIFY_STOREFRONT_TOKEN_TYPE=public if you pasted a public token instead.
 */
export function getShopifyStorefrontTokenHeader(): {
  name: string
  value: string
} | null {
  const privateToken =
    process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN?.trim() || undefined
  const accessToken =
    process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN?.trim() ||
    process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN?.trim() ||
    undefined

  const token = privateToken || accessToken
  if (!token) return null

  const tokenType =
    process.env.SHOPIFY_STOREFRONT_TOKEN_TYPE?.trim().toLowerCase() ||
    (privateToken ? 'private' : 'private')

  if (tokenType === 'public') {
    return {
      name: 'X-Shopify-Storefront-Access-Token',
      value: token,
    }
  }

  return {
    name: 'Shopify-Storefront-Private-Token',
    value: token,
  }
}

/** API version used for Storefront GraphQL. */
export const SHOPIFY_STOREFRONT_API_VERSION =
  process.env.SHOPIFY_STOREFRONT_API_VERSION?.trim() || '2025-01'

export function isShopifyStorefrontConfigured(): boolean {
  return Boolean(getShopifyStoreDomain() && getShopifyStorefrontTokenHeader())
}

/**
 * When true, product catalog is loaded from Shopify Storefront.
 * Defaults on whenever Storefront credentials exist.
 * Set SHOPIFY_CATALOG_ENABLED=false to force Prisma/mock products.
 */
export function isShopifyCatalogEnabled(): boolean {
  const flag = process.env.SHOPIFY_CATALOG_ENABLED?.trim().toLowerCase()
  if (flag === 'false' || flag === '0' || flag === 'off') return false
  if (flag === 'true' || flag === '1' || flag === 'on') {
    return isShopifyStorefrontConfigured()
  }
  return isShopifyStorefrontConfigured()
}

/**
 * When true, cart/checkout redirect to hosted Shopify Checkout.
 * Defaults on whenever Storefront credentials exist.
 * Set SHOPIFY_COMMERCE_ENABLED=false for Gelos /checkout (Paystack/Stripe/COD).
 * Catalog can stay on Shopify via isShopifyCatalogEnabled().
 */
export function isShopifyCommerceEnabled(): boolean {
  const flag = process.env.SHOPIFY_COMMERCE_ENABLED?.trim().toLowerCase()
  if (flag === 'false' || flag === '0' || flag === 'off') return false
  if (flag === 'true' || flag === '1' || flag === 'on') {
    return isShopifyStorefrontConfigured()
  }
  return isShopifyStorefrontConfigured()
}

/**
 * Host that actually serves Shopify Checkout (must DNS to Shopify, not Vercel).
 * Prefer SHOPIFY_CHECKOUT_DOMAIN; falls back to the store *.myshopify.com domain.
 */
export function getShopifyCheckoutDomain(): string | undefined {
  const raw =
    process.env.SHOPIFY_CHECKOUT_DOMAIN?.trim() || getShopifyStoreDomain()
  if (!raw) return undefined
  return raw
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '')
    .toLowerCase()
}

/**
 * Shopify may emit checkoutUrl on the store primary domain (e.g. gelosglobal.com).
 * When that domain hosts the Next.js app on Vercel, /cart/c/* 404s.
 * Rewrite to a Shopify-hosted checkout domain.
 */
export function normalizeShopifyCheckoutUrl(checkoutUrl: string): string {
  const checkoutDomain = getShopifyCheckoutDomain()
  if (!checkoutDomain) return checkoutUrl

  try {
    const url = new URL(checkoutUrl)
    // Draft-order invoices stay on the Shopify shop domain.
    if (url.pathname.includes('/invoices/')) return checkoutUrl
    if (url.hostname.toLowerCase() === checkoutDomain) return checkoutUrl
    url.protocol = 'https:'
    url.hostname = checkoutDomain
    return url.toString()
  } catch {
    return checkoutUrl
  }
}
