import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createShopifyCheckout } from '@/lib/shopify/cart'
import { isShopifyCommerceEnabled } from '@/lib/shopify/config'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  email: z.union([z.string().email(), z.literal('')]).optional(),
  countryCode: z.string().trim().length(2).optional(),
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        quantity: z.number().int().positive(),
        variantImage: z.string().optional(),
        variantLabel: z.string().optional(),
      }),
    )
    .min(1),
})

/**
 * Create a Shopify cart and return the hosted checkout URL.
 * Used when SHOPIFY_STORE_DOMAIN + Storefront token are configured.
 */
export async function POST(request: Request) {
  if (!isShopifyCommerceEnabled()) {
    return NextResponse.json(
      { error: 'Shopify commerce is not enabled' },
      { status: 503 },
    )
  }

  try {
    const json = await request.json()
    const parsed = bodySchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid checkout request', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const result = await createShopifyCheckout({
      email: parsed.data.email?.trim() || undefined,
      countryCode: parsed.data.countryCode,
      lines: parsed.data.items.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
        variantImage: item.variantImage,
        variantLabel: item.variantLabel,
      })),
    })

    return NextResponse.json({
      ok: true,
      checkoutUrl: result.checkoutUrl,
      cartId: result.cartId,
      totalQuantity: result.totalQuantity,
    })
  } catch (error) {
    console.error('[POST /api/shopify/checkout]', error)
    const message =
      error instanceof Error ? error.message : 'Could not start Shopify checkout'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
