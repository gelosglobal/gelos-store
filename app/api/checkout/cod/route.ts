import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  buildLocalizedCheckoutOrder,
  checkoutRequestSchema,
} from '@/lib/build-checkout-order'
import { createCodOrder } from '@/lib/db/orders'
import { getMarketSettings } from '@/lib/db/market-settings'
import { notifyOrderPlaced } from '@/lib/email/send-order-emails'
import type { LocationId } from '@/lib/locations'

const codRequestSchema = checkoutRequestSchema.extend({
  phone: z.string().min(6).max(30),
  shippingAddress: z.string().min(5).max(300),
})

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const parsed = codRequestSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Phone and delivery address are required for cash on delivery.',
          details: parsed.error.flatten(),
        },
        { status: 400 },
      )
    }

    const { email, name, phone, shippingAddress } = parsed.data
    const market = await getMarketSettings(parsed.data.locationId as LocationId)
    if (!market.payments.cod) {
      return NextResponse.json(
        { error: 'Cash on delivery is not enabled for this market.' },
        { status: 400 },
      )
    }

    const { localizedItems, totals, currency, affiliate } =
      await buildLocalizedCheckoutOrder(parsed.data)

    const order = await createCodOrder({
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
      commissionAmount: affiliate?.commissionAmount,
      commissionStatus: 'none',
    })

    await notifyOrderPlaced({
      orderNumber: order.orderNumber,
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
      paymentStatus: order.paymentStatus,
      channel: 'Cash on delivery',
    })

    return NextResponse.json({
      ok: true,
      order: {
        orderNumber: order.orderNumber,
        total: order.total,
        currency: order.currency,
        paymentStatus: order.paymentStatus,
        persisted: order.persisted,
      },
    })
  } catch (error) {
    console.error('[POST /api/checkout/cod]', error)
    const message =
      error instanceof Error ? error.message : 'Could not place order'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
