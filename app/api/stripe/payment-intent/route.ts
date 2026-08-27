import { NextResponse } from 'next/server'
import {
  buildLocalizedCheckoutOrder,
  checkoutRequestSchema,
} from '@/lib/build-checkout-order'
import {
  createPendingPaystackOrder,
  generateOrderNumber,
} from '@/lib/db/orders'
import { getMarketSettings } from '@/lib/db/market-settings'
import type { LocationId } from '@/lib/locations'
import {
  createStripePaymentIntent,
  isStripeConfigured,
} from '@/lib/stripe'
import { shippingDetailsFromCheckout } from '@/lib/dhl/shipping-details'

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

    const locationId = parsed.data.locationId as LocationId
    const market = await getMarketSettings(locationId)

    if (!market.payments.stripe) {
      return NextResponse.json(
        { error: 'Stripe checkout is not enabled for this market.' },
        { status: 400 },
      )
    }

    if (!parsed.data.shippingAddress?.trim()) {
      return NextResponse.json(
        { error: 'Delivery address is required for Stripe checkout.' },
        { status: 400 },
      )
    }

    const { localizedItems, totals, promoCode, affiliate, currency } =
      await buildLocalizedCheckoutOrder(parsed.data)
    const { email, name, phone, shippingAddress } = parsed.data

    const payment = await createStripePaymentIntent({
      email,
      name,
      phone,
      shippingAddress,
      locationId,
      totals,
      currency,
      promoCode,
      affiliateCode: affiliate?.code,
      affiliateId: affiliate?.affiliateId,
      commissionAmount: affiliate?.commissionAmount,
    })

    try {
      await createPendingPaystackOrder({
        orderNumber: generateOrderNumber(),
        paystackReference: payment.paymentIntentId,
        visitorId: parsed.data.visitorId,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        shippingAddress,
        shippingDetails: shippingDetailsFromCheckout(parsed.data.shipping),
        items: localizedItems,
        subtotal: totals.subtotal,
        shipping: totals.shipping,
        discount: totals.discount,
        total: totals.total,
        currency,
        locationId,
        channel: 'Stripe',
        affiliateCode: affiliate?.code,
        affiliateId: affiliate?.affiliateId,
        commissionAmount: affiliate?.commissionAmount ?? 0,
      })
    } catch (persistError) {
      console.error(
        '[POST /api/stripe/payment-intent] Failed to persist pending order',
        persistError,
      )
    }

    return NextResponse.json({
      clientSecret: payment.clientSecret,
      paymentIntentId: payment.paymentIntentId,
    })
  } catch (error) {
    console.error('[POST /api/stripe/payment-intent]', error)
    const message =
      error instanceof Error ? error.message : 'Failed to start Stripe payment'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
