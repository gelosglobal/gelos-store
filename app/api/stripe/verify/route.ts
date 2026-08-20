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
  retrieveStripePaymentIntent,
} from '@/lib/stripe'
import type { CheckoutLineItem } from '@/lib/checkout'

const bodySchema = z
  .object({
    sessionId: z.string().min(3).optional(),
    paymentIntentId: z.string().min(3).optional(),
    eventSourceUrl: z.string().url().optional(),
    visitorId: z.string().min(8).max(120).optional(),
  })
  .refine((data) => Boolean(data.sessionId || data.paymentIntentId), {
    message: 'sessionId or paymentIntentId is required',
  })

function orderItemsForEmail(items: unknown): CheckoutLineItem[] {
  return parseCheckoutLineItems(items)
}

type PaidMeta = {
  reference: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  shippingAddress?: string
  locationId?: string
  subtotal: number
  shipping: number
  discount: number
  total: number
  currency: string
  affiliateCode?: string
  affiliateId?: string
  commissionAmount: number
}

async function loadPaidMeta(input: {
  sessionId?: string
  paymentIntentId?: string
}): Promise<PaidMeta> {
  if (input.paymentIntentId) {
    const intent = await retrieveStripePaymentIntent(input.paymentIntentId)
    if (intent.status !== 'succeeded') {
      throw Object.assign(new Error('Payment is not complete yet.'), {
        status: 402,
      })
    }
    const metadata = intent.metadata ?? {}
    const total = Number(
      metadata.total ??
        (intent.amount_received != null ? intent.amount_received / 100 : 0),
    )
    return {
      reference: intent.id,
      customerName: String(metadata.customer_name ?? 'Customer'),
      customerEmail: String(
        metadata.customer_email || intent.receipt_email || '',
      ),
      customerPhone: String(metadata.customer_phone ?? '') || undefined,
      shippingAddress: String(metadata.shipping_address ?? '') || undefined,
      locationId: String(metadata.location_id ?? '') || undefined,
      subtotal: Number(metadata.subtotal ?? total),
      shipping: Number(metadata.shipping ?? 0),
      discount: Number(metadata.discount ?? 0),
      total,
      currency: (
        metadata.currency ||
        intent.currency ||
        'USD'
      ).toUpperCase(),
      affiliateCode: String(metadata.affiliate_code ?? '') || undefined,
      affiliateId: String(metadata.affiliate_id ?? '') || undefined,
      commissionAmount: Number(metadata.commission_amount ?? 0),
    }
  }

  const session = await retrieveStripeCheckoutSession(input.sessionId!)
  if (session.payment_status !== 'paid') {
    throw Object.assign(
      new Error('Payment is not complete yet. Please try again shortly.'),
      { status: 402 },
    )
  }
  const metadata = session.metadata ?? {}
  const total = Number(
    metadata.total ??
      (session.amount_total != null ? session.amount_total / 100 : 0),
  )
  return {
    reference: session.id,
    customerName: String(metadata.customer_name ?? 'Customer'),
    customerEmail: String(
      metadata.customer_email || session.customer_email || '',
    ),
    customerPhone: String(metadata.customer_phone ?? '') || undefined,
    shippingAddress: String(metadata.shipping_address ?? '') || undefined,
    locationId: String(metadata.location_id ?? '') || undefined,
    subtotal: Number(metadata.subtotal ?? total),
    shipping: Number(metadata.shipping ?? 0),
    discount: Number(metadata.discount ?? 0),
    total,
    currency: (metadata.currency || session.currency || 'USD').toUpperCase(),
    affiliateCode: String(metadata.affiliate_code ?? '') || undefined,
    affiliateId: String(metadata.affiliate_id ?? '') || undefined,
    commissionAmount: Number(metadata.commission_amount ?? 0),
  }
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
        { error: 'Missing Stripe payment reference' },
        { status: 400 },
      )
    }

    const { sessionId, paymentIntentId, eventSourceUrl, visitorId } =
      parsed.data
    const reference = paymentIntentId ?? sessionId!

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

    let meta: PaidMeta
    try {
      meta = await loadPaidMeta({ sessionId, paymentIntentId })
    } catch (error) {
      const status =
        error && typeof error === 'object' && 'status' in error
          ? Number((error as { status: number }).status)
          : 500
      const message =
        error instanceof Error ? error.message : 'Failed to verify payment'
      if (status === 402) {
        return NextResponse.json({ error: message }, { status: 402 })
      }
      throw error
    }

    if (existing) {
      const paid = await markOrderPaidByReference(reference)
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
        shippingAddress: paid.shippingAddress ?? undefined,
        externalId: visitorId,
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

    const order = await createPaidOrder({
      orderNumber: generateOrderNumber(),
      paystackReference: meta.reference,
      visitorId,
      customerName: meta.customerName,
      customerEmail: meta.customerEmail,
      customerPhone: meta.customerPhone,
      shippingAddress: meta.shippingAddress,
      items: [],
      subtotal: meta.subtotal,
      shipping: meta.shipping,
      discount: meta.discount,
      total: meta.total,
      currency: meta.currency,
      channel: 'Stripe',
      affiliateCode: meta.affiliateCode,
      affiliateId: meta.affiliateId,
      commissionAmount: meta.commissionAmount,
    })

    await notifyOrderPlaced({
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: meta.customerName,
      customerEmail: meta.customerEmail,
      customerPhone: meta.customerPhone,
      shippingAddress: meta.shippingAddress,
      items: [],
      subtotal: meta.subtotal,
      shipping: meta.shipping,
      discount: meta.discount,
      total: meta.total,
      currency: meta.currency,
      paymentStatus: 'Paid',
      channel: 'Stripe',
    })

    await sendCapiPurchase({
      orderNumber: order.orderNumber,
      total: meta.total,
      currency: meta.currency,
      items: [],
      customerName: meta.customerName,
      customerEmail: meta.customerEmail,
      customerPhone: meta.customerPhone,
      shippingAddress: meta.shippingAddress,
      locationId: meta.locationId,
      externalId: visitorId,
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
