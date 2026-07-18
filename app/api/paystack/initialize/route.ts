import { NextResponse } from 'next/server'
import {
  buildLocalizedCheckoutOrder,
  checkoutRequestSchema,
} from '@/lib/build-checkout-order'
import {
  createPendingPaystackOrder,
  generateOrderNumber,
} from '@/lib/db/orders'
import { initializeTransaction, isPaystackConfigured } from '@/lib/paystack'
import { getMarketSettings } from '@/lib/db/market-settings'
import type { LocationId } from '@/lib/locations'

function getAppOrigin(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (configured) return configured.replace(/\/$/, '')

  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  const protocol = request.headers.get('x-forwarded-proto') ?? 'http'
  if (host) return `${protocol}://${host}`

  return 'http://localhost:3000'
}

export async function POST(request: Request) {
  if (!isPaystackConfigured()) {
    return NextResponse.json(
      { error: 'Paystack is not configured. Add PAYSTACK_SECRET_KEY to your environment.' },
      { status: 503 },
    )
  }

  let checkoutLocationId: LocationId = 'ghana'

  try {
    const json = await request.json()
    const parsed = checkoutRequestSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid checkout details', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    checkoutLocationId = parsed.data.locationId as LocationId

    const market = await getMarketSettings(checkoutLocationId)
    if (!market.payments.paystack) {
      return NextResponse.json(
        { error: 'Paystack is not enabled for this market.' },
        { status: 400 },
      )
    }

    const { localizedItems, totals, promoCode, affiliate, currency } =
      await buildLocalizedCheckoutOrder(parsed.data)
    const { email, name, phone, shippingAddress } = parsed.data

    const callbackUrl = `${getAppOrigin(request)}/checkout/callback`
    const payment = await initializeTransaction({
      email,
      name,
      phone,
      shippingAddress,
      locationId: checkoutLocationId,
      items: localizedItems,
      totals,
      promoApplied: Boolean(promoCode),
      promoCode,
      affiliateCode: affiliate?.code,
      affiliateId: affiliate?.affiliateId,
      commissionAmount: affiliate?.commissionAmount,
      callbackUrl,
    })

    // Save full cart items before redirect. Paystack metadata often drops or
    // stringifies nested items, which used to leave paid orders with 0 items.
    try {
      await createPendingPaystackOrder({
        orderNumber: generateOrderNumber(),
        paystackReference: payment.reference,
        visitorId: parsed.data.visitorId,
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
        affiliateCode: affiliate?.code,
        affiliateId: affiliate?.affiliateId,
        commissionAmount: affiliate?.commissionAmount ?? 0,
      })
    } catch (persistError) {
      console.error(
        '[POST /api/paystack/initialize] Failed to persist pending order',
        persistError,
      )
    }

    return NextResponse.json({
      authorizationUrl: payment.authorizationUrl,
      reference: payment.reference,
    })
  } catch (error) {
    console.error('[POST /api/paystack/initialize]', error)
    const rawMessage =
      error instanceof Error ? error.message : 'Failed to start payment'
    const currencyHint =
      checkoutLocationId === 'nigeria'
        ? 'NGN'
        : checkoutLocationId === 'ghana'
          ? 'GHS'
          : 'USD'
    const message = rawMessage.toLowerCase().includes('currency not supported')
      ? `${rawMessage}. Enable ${currencyHint} in your Paystack dashboard under Settings → Preferences → Currency.`
      : rawMessage
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
