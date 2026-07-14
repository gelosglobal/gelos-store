import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { isDatabaseConfigured } from '@/lib/env'
import { recordAffiliateConversion } from '@/lib/db/affiliates'
import type { CheckoutLineItem } from '@/lib/checkout'

export type CreateOrderInput = {
  orderNumber?: string
  paystackReference: string
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
  // COD is confirmed at placement; Paystack pending waits until verify marks Paid.
  const shouldTrackCommission =
    Boolean(input.affiliateId) &&
    commissionAmount > 0 &&
    (paymentStatus === 'Paid' || channel === 'Cash on delivery')

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

  return {
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
  })
}

export async function getOrderByReference(reference: string) {
  if (!isDatabaseConfigured()) return null
  return prisma.order.findUnique({
    where: { paystackReference: reference },
  })
}

/** Mark a pending Paystack order as paid after successful verification. */
export async function markOrderPaidByReference(reference: string) {
  if (!isDatabaseConfigured()) return null

  const existing = await prisma.order.findUnique({
    where: { paystackReference: reference },
  })
  if (!existing) return null
  if (existing.paymentStatus === 'Paid') return existing

  const commissionAmount = existing.commissionAmount ?? 0
  const shouldTrackCommission =
    Boolean(existing.affiliateId) && commissionAmount > 0

  const updated = await prisma.order.update({
    where: { paystackReference: reference },
    data: {
      paymentStatus: 'Paid',
      channel: existing.channel?.trim() || 'Paystack',
      ...(shouldTrackCommission ? { commissionStatus: 'pending' } : {}),
    },
  })

  if (shouldTrackCommission && existing.affiliateId) {
    await recordAffiliateConversion({
      affiliateId: existing.affiliateId,
      orderTotal: existing.total,
      commissionAmount,
    })
  }

  return updated
}
