import type { Order as PrismaOrder } from '@prisma/client'
import { buildOrderConversionSummary } from '@/lib/admin/order-conversion'
import { formatOrderDateLabel } from '@/lib/admin/order-format'
import { buildOrderTimeline } from '@/lib/admin/order-timeline'
import { isDatabaseConfigured } from '@/lib/env'
import { normalizeImageUrl } from '@/lib/image-url'
import { parseCheckoutLineItems } from '@/lib/parse-checkout-line-items'
import { prisma } from '@/lib/prisma'
import type {
  AdminOrderDetail,
  FulfillmentStatus,
  PaymentStatus,
  StoreOrder,
  StoreOrderLineItem,
} from '@/lib/types/order'

function parseLineItems(items: unknown): StoreOrderLineItem[] {
  return parseCheckoutLineItems(items).map((item) => ({
    id: item.id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    variantLabel: item.variantLabel,
    variantImage: item.variantImage,
    productName: item.productName,
    lineTotal: item.price * item.quantity,
  }))
}

function countLineItems(items: unknown): number {
  return parseLineItems(items).reduce((sum, item) => sum + item.quantity, 0)
}

function asPaymentStatus(value: string): PaymentStatus {
  const valid: PaymentStatus[] = [
    'Paid',
    'Payment pending',
    'Partially paid',
    'Refunded',
    'Voided',
  ]
  return valid.includes(value as PaymentStatus)
    ? (value as PaymentStatus)
    : 'Payment pending'
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

export function prismaOrderToAdminDetail(
  order: PrismaOrder,
  conversionSummary?: ReturnType<typeof buildOrderConversionSummary>,
): AdminOrderDetail {
  const lineItems = parseLineItems(order.items)
  const paymentStatus = asPaymentStatus(order.paymentStatus)
  const fulfillmentStatus = asFulfillmentStatus(order.fulfillmentStatus)

  return {
    ...prismaOrderToStoreOrder(order),
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone ?? undefined,
    shippingAddress: order.shippingAddress ?? undefined,
    lineItems,
    subtotal: order.subtotal,
    shipping: order.shipping,
    discount: order.discount,
    paystackReference: order.paystackReference,
    affiliateCode: order.affiliateCode ?? undefined,
    affiliateId: order.affiliateId ?? undefined,
    commissionAmount: order.commissionAmount,
    commissionStatus: order.commissionStatus,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    timeline: buildOrderTimeline({
      orderNumber: order.orderNumber,
      channel: order.channel,
      paymentStatus,
      fulfillmentStatus,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      affiliateCode: order.affiliateCode ?? undefined,
      commissionAmount: order.commissionAmount,
      currency: order.currency,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      total: order.total,
    }),
    conversionSummary:
      conversionSummary ??
      buildOrderConversionSummary(order, [
        {
          id: order.id,
          createdAt: order.createdAt,
          affiliateCode: order.affiliateCode,
          channel: order.channel,
        },
      ]),
  }
}

async function enrichLineItemsWithProducts(
  lineItems: StoreOrderLineItem[],
): Promise<StoreOrderLineItem[]> {
  if (lineItems.length === 0) return lineItems

  const productIds = [...new Set(lineItems.map((item) => item.id))]
  const products = await prisma.product.findMany({
    where: { productId: { in: productIds } },
    select: {
      productId: true,
      name: true,
      category: true,
      image: true,
      slug: true,
    },
  })

  const productMap = new Map(products.map((product) => [product.productId, product]))

  return lineItems.map((item) => {
    const product = productMap.get(item.id)
    const image = normalizeImageUrl(
      item.variantImage?.trim() || product?.image || '',
    )

    return {
      ...item,
      productName: item.productName ?? product?.name ?? item.name,
      image: image || undefined,
      category: product?.category,
      productHref: product ? `/product/${product.slug}` : undefined,
    }
  })
}

export async function listAdminOrders(): Promise<StoreOrder[]> {
  if (!isDatabaseConfigured()) return []

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return orders.map(prismaOrderToStoreOrder)
}

export async function getAdminOrderById(
  id: string,
): Promise<AdminOrderDetail | null> {
  if (!isDatabaseConfigured()) return null

  const order = await prisma.order.findUnique({ where: { id } })
  if (!order) return null

  const email = order.customerEmail.trim()
  const customerOrders = email
    ? await prisma.order.findMany({
        where: { customerEmail: email },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          createdAt: true,
          affiliateCode: true,
          channel: true,
        },
      })
    : [
        {
          id: order.id,
          createdAt: order.createdAt,
          affiliateCode: order.affiliateCode,
          channel: order.channel,
        },
      ]

  const conversionSummary = buildOrderConversionSummary(order, customerOrders)
  const detail = prismaOrderToAdminDetail(order, conversionSummary)
  detail.lineItems = await enrichLineItemsWithProducts(detail.lineItems)
  return detail
}

type UpdateAdminOrderInput = {
  paymentStatus?: PaymentStatus
  fulfillmentStatus?: FulfillmentStatus
}

export async function updateAdminOrder(
  id: string,
  input: UpdateAdminOrderInput,
): Promise<AdminOrderDetail | null> {
  if (!isDatabaseConfigured()) return null

  const existing = await prisma.order.findUnique({ where: { id } })
  if (!existing) return null

  await prisma.order.update({
    where: { id },
    data: {
      ...(input.paymentStatus
        ? { paymentStatus: input.paymentStatus }
        : {}),
      ...(input.fulfillmentStatus
        ? { fulfillmentStatus: input.fulfillmentStatus }
        : {}),
    },
  })

  return getAdminOrderById(id)
}

export async function countAdminOrders(): Promise<number> {
  if (!isDatabaseConfigured()) return 0
  return prisma.order.count()
}
