import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { isDatabaseConfigured } from '@/lib/env'
import { markCheckoutRecovered } from '@/lib/db/abandoned-checkouts'
import { recordAffiliateConversion } from '@/lib/db/affiliates'
import type { CheckoutLineItem } from '@/lib/checkout'

export type CreateOrderInput = {
  orderNumber?: string
  paystackReference: string
  visitorId?: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  shippingAddress?: string
  items: CheckoutLineItem[]
  subtotal: number
  shipping: number
  discount: number
  total: number
  currency: string
  paymentStatus?: string
  channel?: string
  affiliateCode?: string
  affiliateId?: string
  commissionAmount?: number
  commissionStatus?: 'none' | 'pending' | 'paid'
}

export function generateOrderNumber(): string {
  const suffix = Date.now().toString().slice(-6)
  return `GELOS-${suffix}`
}

export function createCodReference(): string {
  const suffix = Math.random().toString(36).slice(2, 10)
  return `cod_${Date.now()}_${suffix}`
}

export async function createOrder(input: CreateOrderInput) {
  const orderNumber = input.orderNumber ?? generateOrderNumber()
  const paymentStatus = input.paymentStatus ?? 'Payment pending'

  if (!isDatabaseConfigured()) {
    return {
      id: undefined,
      orderNumber,
      paystackReference: input.paystackReference,
      total: input.total,
      currency: input.currency,
      paymentStatus,
      persisted: false as const,
    }
  }

  const commissionAmount = input.commissionAmount ?? 0
  const channel = input.channel ?? 'Online store'
  // Only credit affiliate revenue after the order is actually paid.
  const shouldTrackCommission =
    Boolean(input.affiliateId) &&
    commissionAmount > 0 &&
    paymentStatus === 'Paid'

  const order = await prisma.order.create({
    data: {
      orderNumber,
      paystackReference: input.paystackReference,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      shippingAddress: input.shippingAddress,
      items: input.items as Prisma.InputJsonValue,
      subtotal: input.subtotal,
      shipping: input.shipping,
      discount: input.discount,
      total: input.total,
      currency: input.currency,
      paymentStatus,
      fulfillmentStatus: 'Unfulfilled',
      channel,
      affiliateCode: input.affiliateCode,
      affiliateId: input.affiliateId,
      commissionAmount,
      commissionStatus: shouldTrackCommission
        ? (input.commissionStatus ?? 'pending')
        : input.commissionStatus === 'paid'
          ? 'paid'
          : 'none',
    },
  })

  if (shouldTrackCommission && input.affiliateId) {
    await recordAffiliateConversion({
      affiliateId: input.affiliateId,
      orderTotal: input.total,
      commissionAmount,
    })
  }

  await markCheckoutRecovered({
    visitorId: input.visitorId,
    customerEmail: input.customerEmail,
  })

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    paystackReference: order.paystackReference,
    total: order.total,
    currency: order.currency,
    paymentStatus: order.paymentStatus,
    persisted: true as const,
  }
}

export async function createPaidOrder(input: CreateOrderInput) {
  return createOrder({
    ...input,
    paymentStatus: 'Paid',
    channel: input.channel ?? 'Paystack',
    commissionStatus:
      input.affiliateId && (input.commissionAmount ?? 0) > 0
        ? 'pending'
        : 'none',
  })
}

/** Persist cart line items before Paystack redirect so verify never relies on metadata alone. */
export async function createPendingPaystackOrder(input: CreateOrderInput) {
  return createOrder({
    ...input,
    paymentStatus: 'Payment pending',
    channel: input.channel ?? 'Paystack',
    commissionStatus: 'none',
  })
}

export async function createCodOrder(
  input: Omit<CreateOrderInput, 'paystackReference' | 'paymentStatus' | 'channel'>,
) {
  return createOrder({
    ...input,
    paystackReference: createCodReference(),
    paymentStatus: 'Payment pending',
    channel: 'Cash on delivery',
    // Affiliate attribution is stored, but revenue waits until payment is Paid.
    commissionStatus: 'none',
  })
}

export async function getOrderByReference(reference: string) {
  if (!isDatabaseConfigured()) return null
  return prisma.order.findUnique({
    where: { paystackReference: reference },
  })
}

/**
 * Credit affiliate commission when an order first becomes Paid.
 * Idempotent: skips orders already pending/paid for commission.
 */
export async function creditAffiliateCommissionForPaidOrder(order: {
  affiliateId: string | null
  commissionAmount: number
  commissionStatus: string
  total: number
  id: string
}): Promise<boolean> {
  const commissionAmount = order.commissionAmount ?? 0
  if (
    !order.affiliateId ||
    commissionAmount <= 0 ||
    order.commissionStatus === 'pending' ||
    order.commissionStatus === 'paid'
  ) {
    return false
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { commissionStatus: 'pending' },
  })

  await recordAffiliateConversion({
    affiliateId: order.affiliateId,
    orderTotal: order.total,
    commissionAmount,
  })

  return true
}

/** Mark a pending Paystack/Stripe/COD order as paid after successful verification. */
export async function markOrderPaidByReference(reference: string) {
  if (!isDatabaseConfigured()) return null

  const existing = await prisma.order.findUnique({
    where: { paystackReference: reference },
  })
  if (!existing) return null
  if (existing.paymentStatus === 'Paid') return existing

  const updated = await prisma.order.update({
    where: { paystackReference: reference },
    data: {
      paymentStatus: 'Paid',
      channel: existing.channel?.trim() || 'Paystack',
    },
  })

  await creditAffiliateCommissionForPaidOrder(updated)

  return prisma.order.findUnique({
    where: { paystackReference: reference },
  })
}
