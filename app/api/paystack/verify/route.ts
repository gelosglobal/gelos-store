import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  createPaidOrder,
  generateOrderNumber,
  getOrderByReference,
  markOrderPaidByReference,
} from '@/lib/db/orders'
import { notifyOrderPlaced } from '@/lib/email/send-order-emails'
import { parseCheckoutLineItems } from '@/lib/parse-checkout-line-items'
import { isPaystackConfigured, verifyTransaction } from '@/lib/paystack'
import type { CheckoutLineItem } from '@/lib/checkout'

const bodySchema = z.object({
  reference: z.string().min(3),
})

function orderItemsForEmail(items: unknown): CheckoutLineItem[] {
  return parseCheckoutLineItems(items)
}

export async function POST(request: Request) {
  if (!isPaystackConfigured()) {
    return NextResponse.json(
      { error: 'Paystack is not configured' },
      { status: 503 },
    )
  }

  try {
    const json = await request.json()
    const parsed = bodySchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Missing payment reference' }, { status: 400 })
    }

    const { reference } = parsed.data
    const existing = await getOrderByReference(reference)

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

    const payment = await verifyTransaction(reference)

    // Preferred path: pending order created at initialize already has full line items.
    if (existing) {
      const paid = await markOrderPaidByReference(reference)
      if (!paid) {
        throw new Error('Could not mark order as paid')
      }

      const items = orderItemsForEmail(paid.items)
      await notifyOrderPlaced({
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
        channel: paid.channel,
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

    // Fallback for older flows / missing pending draft: rebuild from Paystack metadata.
    const metadata = payment.metadata
    const items = parseCheckoutLineItems(metadata.items)
    const subtotal = Number(metadata.subtotal ?? 0)
    const discount = Number(metadata.discount ?? 0)
    const shipping = Number(metadata.shipping ?? 0)
    const total = Number(metadata.total ?? payment.amount / 100)

    const customerName = String(metadata.customer_name ?? 'Customer')
    const customerEmail = String(metadata.customer_email ?? '')
    const customerPhone = String(metadata.customer_phone ?? '') || undefined
    const shippingAddress = String(metadata.shipping_address ?? '') || undefined
    const channel = payment.channel ?? 'Paystack'
    const affiliateCode = String(metadata.affiliate_code ?? '') || undefined
    const affiliateId = String(metadata.affiliate_id ?? '') || undefined
    const commissionAmount = Number(metadata.commission_amount ?? 0)

    const order = await createPaidOrder({
      orderNumber: generateOrderNumber(),
      paystackReference: payment.reference,
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      items,
      subtotal,
      shipping,
      discount,
      total,
      currency: payment.currency,
      channel,
      affiliateCode,
      affiliateId,
      commissionAmount,
      commissionStatus:
        affiliateId && commissionAmount > 0 ? 'pending' : 'none',
    })

    await notifyOrderPlaced({
      orderNumber: order.orderNumber,
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      items,
      subtotal,
      shipping,
      discount,
      total,
      currency: payment.currency,
      paymentStatus: 'Paid',
      channel,
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
    console.error('[POST /api/paystack/verify]', error)
    const message =
      error instanceof Error ? error.message : 'Payment verification failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
