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

  if (!isDatabaseConfigured()) {
    return {
      orderNumber,
      paystackReference: input.paystackReference,
      total: input.total,
      currency: input.currency,
      paymentStatus: input.paymentStatus ?? 'Payment pending',
      persisted: false as const,
    }
  }

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
      paymentStatus: input.paymentStatus ?? 'Payment pending',
      fulfillmentStatus: 'Unfulfilled',
      channel: input.channel ?? 'Online store',
      affiliateCode: input.affiliateCode,
      affiliateId: input.affiliateId,
      commissionAmount: input.commissionAmount ?? 0,
      commissionStatus: input.commissionStatus ?? 'none',
    },
  })

  if (input.affiliateId && (input.commissionAmount ?? 0) > 0) {
    await recordAffiliateConversion({
      affiliateId: input.affiliateId,
      orderTotal: input.total,
      commissionAmount: input.commissionAmount ?? 0,
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
