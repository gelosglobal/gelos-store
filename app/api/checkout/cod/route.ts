import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  buildLocalizedCheckoutOrder,
  checkoutRequestSchema,
} from '@/lib/build-checkout-order'
import { createCodOrder } from '@/lib/db/orders'
import { notifyOrderPlaced } from '@/lib/email/send-order-emails'

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
    const { localizedItems, totals, currency } =
      await buildLocalizedCheckoutOrder(parsed.data)

    const order = await createCodOrder({
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
    })

    notifyOrderPlaced({
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
