import { NextResponse } from 'next/server'
import {
  isShopifyCommerceEnabled,
  isShopifyStorefrontConfigured,
  getShopifyStoreDomain,
} from '@/lib/shopify/config'

export const dynamic = 'force-dynamic'

/** Health check for Shopify Storefront configuration (no secrets leaked). */
export async function GET() {
  const configured = isShopifyStorefrontConfigured()
  const enabled = isShopifyCommerceEnabled()
  const domain = getShopifyStoreDomain()

  return NextResponse.json({
    configured,
    enabled,
    domain: domain ?? null,
    mode: enabled ? 'shopify' : 'legacy',
  })
}
