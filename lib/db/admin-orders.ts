import type { Order as PrismaOrder } from '@prisma/client'
import { formatOrderDateLabel } from '@/lib/admin/order-format'
import { isDatabaseConfigured } from '@/lib/env'
import { prisma } from '@/lib/prisma'
import type { CheckoutLineItem } from '@/lib/checkout'
import type {
  FulfillmentStatus,
  PaymentStatus,
  StoreOrder,
} from '@/lib/types/order'

function countLineItems(items: unknown): number {
  if (!Array.isArray(items)) return 0
  return items.reduce((sum, entry) => {
    const item = entry as CheckoutLineItem
    return sum + (Number(item.quantity) || 0)
  }, 0)
}

function asPaymentStatus(value: string): PaymentStatus {
  return value === 'Paid' ? 'Paid' : 'Payment pending'
}

function asFulfillmentStatus(value: string): FulfillmentStatus {
  const valid: FulfillmentStatus[] = [
    'Unfulfilled',
    'Fulfilled',
    'Processing',
    'Shipped',
    'Delivered',
  ]
  return valid.includes(value as FulfillmentStatus)
    ? (value as FulfillmentStatus)
    : 'Unfulfilled'
}

function deliveryMethodForChannel(channel: string): string {
  if (/cash on delivery/i.test(channel)) return 'Cash on delivery'
  if (/paystack/i.test(channel)) return 'Online payment'
  return 'Standard shipping'
}

export function prismaOrderToStoreOrder(order: PrismaOrder): StoreOrder {
  const fulfillmentStatus = asFulfillmentStatus(order.fulfillmentStatus)
  const createdAt = order.createdAt

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customer: order.customerName,
    date: createdAt.toISOString(),
    dateLabel: formatOrderDateLabel(createdAt),
    total: order.total,
    currency: order.currency,
    items: countLineItems(order.items),
    paymentStatus: asPaymentStatus(order.paymentStatus),
    fulfillmentStatus,
    status: fulfillmentStatus,
    channel: order.channel,
    deliveryMethod: deliveryMethodForChannel(order.channel),
    deliveryStatus:
      fulfillmentStatus === 'Delivered'
        ? 'Delivered'
        : fulfillmentStatus === 'Shipped'
          ? 'In transit'
          : undefined,
    tags: [],
  }
}

export async function listAdminOrders(): Promise<StoreOrder[]> {
  if (!isDatabaseConfigured()) return []

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return orders.map(prismaOrderToStoreOrder)
}

export async function countAdminOrders(): Promise<number> {
  if (!isDatabaseConfigured()) return 0
  return prisma.order.count()
}
