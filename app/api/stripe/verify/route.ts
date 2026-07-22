import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  createPaidOrder,
  generateOrderNumber,
  getOrderByReference,
  markOrderPaidByReference,
} from '@/lib/db/orders'
import { notifyOrderPlaced } from '@/lib/email/send-order-emails'
import { sendCapiPurchase } from '@/lib/meta-conversions-api'
import { parseCheckoutLineItems } from '@/lib/parse-checkout-line-items'
import {
  isStripeConfigured,
  retrieveStripeCheckoutSession,
} from '@/lib/stripe'
import type { CheckoutLineItem } from '@/lib/checkout'

const bodySchema = z.object({
  sessionId: z.string().min(3),
  eventSourceUrl: z.string().url().optional(),
})

function orderItemsForEmail(items: unknown): CheckoutLineItem[] {
  return parseCheckoutLineItems(items)
}

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: 'Stripe is not configured' },
      { status: 503 },
    )
  }

  try {
    const json = await request.json()
    const parsed = bodySchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Missing Stripe checkout session' },
        { status: 400 },
      )
    }

    const { sessionId, eventSourceUrl } = parsed.data
    const existing = await getOrderByReference(sessionId)

    if (existing?.paymentStatus === 'Paid') {
      return NextResponse.json({
        ok: true,
        alreadyProcessed: true,
        order: {
          orderNumber: existing.orderNumber,
          total: existing.total,
          currency: existing.currency,
          reference: existing.paystackReference,
        },
      })
    }

    const session = await retrieveStripeCheckoutSession(sessionId)

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment is not complete yet. Please try again shortly.' },
        { status: 402 },
      )
    }

    if (existing) {
      const paid = await markOrderPaidByReference(sessionId)
      if (!paid) {
        throw new Error('Could not mark order as paid')
      }

      const items = orderItemsForEmail(paid.items)
      await notifyOrderPlaced({
        orderId: paid.id,
        orderNumber: paid.orderNumber,
        customerName: paid.customerName,
        customerEmail: paid.customerEmail,
        customerPhone: paid.customerPhone ?? undefined,
        shippingAddress: paid.shippingAddress ?? undefined,
        items,
        subtotal: paid.subtotal,
        shipping: paid.shipping,
        discount: paid.discount,
        total: paid.total,
        currency: paid.currency,
        paymentStatus: 'Paid',
        channel: 'Stripe',
      })

      await sendCapiPurchase({
        orderNumber: paid.orderNumber,
        total: paid.total,
        currency: paid.currency,
        items,
        customerName: paid.customerName,
        customerEmail: paid.customerEmail,
        customerPhone: paid.customerPhone ?? undefined,
        eventSourceUrl,
        request,
      })

      return NextResponse.json({
        ok: true,
        order: {
          orderNumber: paid.orderNumber,
          total: paid.total,
          currency: paid.currency,
          reference: paid.paystackReference,
          persisted: true,
        },
      })
    }

    const metadata = session.metadata ?? {}
    const total = Number(
      metadata.total ??
        (session.amount_total != null ? session.amount_total / 100 : 0),
    )
    const subtotal = Number(metadata.subtotal ?? total)
    const discount = Number(metadata.discount ?? 0)
    const shipping = Number(metadata.shipping ?? 0)
    const currency = (
      metadata.currency ||
      session.currency ||
      'USD'
    ).toUpperCase()

    const order = await createPaidOrder({
      orderNumber: generateOrderNumber(),
      paystackReference: sessionId,
      customerName: String(metadata.customer_name ?? 'Customer'),
      customerEmail: String(
        metadata.customer_email || session.customer_email || '',
      ),
      customerPhone: String(metadata.customer_phone ?? '') || undefined,
      shippingAddress: String(metadata.shipping_address ?? '') || undefined,
      items: [],
      subtotal,
      shipping,
      discount,
      total,
      currency,
      channel: 'Stripe',
      affiliateCode: String(metadata.affiliate_code ?? '') || undefined,
      affiliateId: String(metadata.affiliate_id ?? '') || undefined,
      commissionAmount: Number(metadata.commission_amount ?? 0),
    })

    await notifyOrderPlaced({
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: String(metadata.customer_name ?? 'Customer'),
      customerEmail: String(
        metadata.customer_email || session.customer_email || '',
      ),
      customerPhone: String(metadata.customer_phone ?? '') || undefined,
      shippingAddress: String(metadata.shipping_address ?? '') || undefined,
      items: [],
      subtotal,
      shipping,
      discount,
      total,
      currency,
      paymentStatus: 'Paid',
      channel: 'Stripe',
    })

    await sendCapiPurchase({
      orderNumber: order.orderNumber,
      total,
      currency,
      items: [],
      customerName: String(metadata.customer_name ?? 'Customer'),
      customerEmail: String(
        metadata.customer_email || session.customer_email || '',
      ),
      customerPhone: String(metadata.customer_phone ?? '') || undefined,
      eventSourceUrl,
      request,
    })

    return NextResponse.json({
      ok: true,
      order: {
        orderNumber: order.orderNumber,
        total: order.total,
        currency: order.currency,
        reference: order.paystackReference,
        persisted: order.persisted,
      },
    })
  } catch (error) {
    console.error('[POST /api/stripe/verify]', error)
    const message =
      error instanceof Error ? error.message : 'Failed to verify Stripe payment'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
