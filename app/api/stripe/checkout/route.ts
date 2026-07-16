import { NextResponse } from 'next/server'
import {
  buildLocalizedCheckoutOrder,
  checkoutRequestSchema,
} from '@/lib/build-checkout-order'
import {
  createPendingPaystackOrder,
  generateOrderNumber,
} from '@/lib/db/orders'
import { createStripeCheckoutSession, isStripeConfigured } from '@/lib/stripe'
import { assertUsInhalerCartItems } from '@/lib/us-market'

function getAppOrigin(request: Request): string {
  // Prefer the live request host in local/dev so Stripe redirects don't
  // bounce to production when NEXT_PUBLIC_APP_URL is set to the live domain.
  if (process.env.NODE_ENV !== 'production') {
    const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
    const protocol = request.headers.get('x-forwarded-proto') ?? 'http'
    if (host) return `${protocol}://${host}`
  }

  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (configured) return configured.replace(/\/$/, '')

  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  const protocol = request.headers.get('x-forwarded-proto') ?? 'http'
  if (host) return `${protocol}://${host}`

  return 'http://localhost:3000'
}

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      {
        error:
          'Stripe is not configured. Add STRIPE_SECRET_KEY to your environment.',
      },
      { status: 503 },
    )
  }

  try {
    const json = await request.json()
    const parsed = checkoutRequestSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid checkout details', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    if (parsed.data.locationId !== 'usa') {
      return NextResponse.json(
        { error: 'Stripe checkout is only available for the USA market.' },
        { status: 400 },
      )
    }

    assertUsInhalerCartItems(parsed.data.items)

    if (!parsed.data.shippingAddress?.trim()) {
      return NextResponse.json(
        { error: 'Delivery address is required for US orders.' },
        { status: 400 },
      )
    }

    const { localizedItems, totals, promoCode, affiliate, currency } =
      await buildLocalizedCheckoutOrder(parsed.data)
    const { email, name, phone, shippingAddress } = parsed.data

    const origin = getAppOrigin(request)
    const payment = await createStripeCheckoutSession({
      email,
      name,
      phone,
      shippingAddress,
      items: localizedItems,
      totals,
      currency,
      promoCode,
      affiliateCode: affiliate?.code,
      affiliateId: affiliate?.affiliateId,
      commissionAmount: affiliate?.commissionAmount,
      successUrl: `${origin}/checkout/stripe-callback?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/checkout`,
    })

    try {
      await createPendingPaystackOrder({
        orderNumber: generateOrderNumber(),
        paystackReference: payment.sessionId,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        shippingAddress,
        items: localizedItems,
        subtotal: totals.subtotal,
        shipping: totals.shipping,
        discount: totals.discount,
        total: totals.total,
        currency,
        channel: 'Stripe',
        affiliateCode: affiliate?.code,
        affiliateId: affiliate?.affiliateId,
        commissionAmount: affiliate?.commissionAmount ?? 0,
      })
    } catch (persistError) {
      console.error(
        '[POST /api/stripe/checkout] Failed to persist pending order',
        persistError,
      )
    }

    return NextResponse.json({
      url: payment.url,
      sessionId: payment.sessionId,
    })
  } catch (error) {
    console.error('[POST /api/stripe/checkout]', error)
    const message =
      error instanceof Error ? error.message : 'Failed to start Stripe payment'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
