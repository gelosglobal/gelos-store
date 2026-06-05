import { NextResponse } from 'next/server'
import {
  buildLocalizedCheckoutOrder,
  checkoutRequestSchema,
} from '@/lib/build-checkout-order'
import { initializeTransaction, isPaystackConfigured } from '@/lib/paystack'
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

    const { localizedItems, totals, promoCode } =
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
      callbackUrl,
    })

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
