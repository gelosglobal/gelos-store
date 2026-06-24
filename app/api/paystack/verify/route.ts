import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  createPaidOrder,
  generateOrderNumber,
  getOrderByReference,
} from '@/lib/db/orders'
import { notifyOrderPlaced } from '@/lib/email/send-order-emails'
import { isPaystackConfigured, verifyTransaction } from '@/lib/paystack'
import type { CheckoutLineItem } from '@/lib/checkout'

const bodySchema = z.object({
  reference: z.string().min(3),
})

function parseItems(metadata: Record<string, unknown>): CheckoutLineItem[] {
  const raw = metadata.items
  if (!Array.isArray(raw)) return []

  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const record = item as Record<string, unknown>
      if (
        typeof record.id !== 'string' ||
        typeof record.name !== 'string' ||
        typeof record.price !== 'number' ||
        typeof record.quantity !== 'number'
      ) {
        return null
      }
      return {
        id: record.id,
        name: record.name,
        productName:
          typeof record.productName === 'string' ? record.productName : undefined,
        price: record.price,
        quantity: record.quantity,
        variantLabel:
          typeof record.variantLabel === 'string' ? record.variantLabel : undefined,
        variantImage:
          typeof record.variantImage === 'string' ? record.variantImage : undefined,
      }
    })
    .filter((item): item is CheckoutLineItem => item !== null)
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

    if (existing) {
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
    const metadata = payment.metadata

    const items = parseItems(metadata)
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
