import { NextResponse } from 'next/server'
import { z } from 'zod'
import { sendCapiInitiateCheckout } from '@/lib/meta-conversions-api'
import { createShopifyCheckout } from '@/lib/shopify/cart'
import { isShopifyCommerceEnabled } from '@/lib/shopify/config'
import { readVisitorIdFromCookieHeader } from '@/lib/visitor-id'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  email: z.union([z.string().email(), z.literal('')]).optional(),
  phone: z.string().trim().max(30).optional(),
  countryCode: z.string().trim().length(2).optional(),
  locationId: z.enum(['international', 'nigeria', 'ghana', 'usa']).optional(),
  visitorId: z.string().min(8).max(120).optional(),
  eventId: z.string().min(8).max(160).optional(),
  eventSourceUrl: z.string().url().optional(),
  total: z.number().nonnegative().optional(),
  currency: z.string().trim().min(3).max(3).optional(),
  promoCode: z.string().trim().max(40).optional(),
  smileRewardFreeShipping: z.boolean().optional(),
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        quantity: z.number().int().positive(),
        variantImage: z.string().optional(),
        variantLabel: z.string().optional(),
        unitPrice: z.number().nonnegative().optional(),
      }),
    )
    .min(1),
})

function locationIdFromCountryCode(
  countryCode: string | undefined,
): 'international' | 'nigeria' | 'ghana' | 'usa' | undefined {
  const code = countryCode?.trim().toUpperCase()
  if (code === 'GH') return 'ghana'
  if (code === 'US') return 'usa'
  return undefined
}

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

    const email = parsed.data.email?.trim() || undefined
    const phone = parsed.data.phone?.trim() || undefined
    const visitorId =
      parsed.data.visitorId?.trim() ||
      readVisitorIdFromCookieHeader(request.headers.get('cookie'))
    const locationId =
      parsed.data.locationId ??
      locationIdFromCountryCode(parsed.data.countryCode)

    const result = await createShopifyCheckout({
      email,
      phone,
      countryCode: parsed.data.countryCode,
      locationId,
      visitorId,
      promoCode: parsed.data.promoCode,
      smileRewardFreeShipping: parsed.data.smileRewardFreeShipping,
      lines: parsed.data.items.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
        variantImage: item.variantImage,
        variantLabel: item.variantLabel,
        unitPrice: item.unitPrice,
      })),
    })

    // Mirror browser InitiateCheckout on CAPI (same event_id) so Meta can
    // merge Pixel + server params for Event Match Quality (em + ph).
    // Docs: https://developers.facebook.com/documentation/ads-commerce/conversions-api
    if (parsed.data.eventId && parsed.data.total !== undefined) {
      await sendCapiInitiateCheckout({
        eventId: parsed.data.eventId,
        total: parsed.data.total,
        currency: parsed.data.currency || 'GHS',
        items: parsed.data.items.map((item) => ({
          id: item.id,
          quantity: item.quantity,
        })),
        customerEmail: email,
        customerPhone: phone,
        locationId,
        countryCode: parsed.data.countryCode,
        externalId: visitorId,
        eventSourceUrl: parsed.data.eventSourceUrl,
        request,
      })
    }

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
