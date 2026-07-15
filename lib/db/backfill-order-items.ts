import type { Prisma } from '@prisma/client'
import { isDatabaseConfigured } from '@/lib/env'
import { parseCheckoutLineItems } from '@/lib/parse-checkout-line-items'
import {
  fetchTransactionMetadata,
  isPaystackConfigured,
} from '@/lib/paystack'
import { prisma } from '@/lib/prisma'

export type BackfillOrderItemsResult = {
  scanned: number
  recovered: number
  skipped: number
  failed: number
  results: {
    orderId: string
    orderNumber: string
    status: 'recovered' | 'skipped' | 'failed'
    itemCount?: number
    reason?: string
  }[]
}

function orderHasLineItems(items: unknown): boolean {
  return parseCheckoutLineItems(items).length > 0
}

function isPaystackReference(reference: string): boolean {
  const trimmed = reference.trim()
  if (!trimmed) return false
  if (trimmed.startsWith('cod_')) return false
  return true
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function recoverOrderItemsFromPaystack(order: {
  id: string
  orderNumber: string
  paystackReference: string
  items: unknown
}): Promise<BackfillOrderItemsResult['results'][number]> {
  if (orderHasLineItems(order.items)) {
    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: 'skipped',
      reason: 'Order already has line items',
    }
  }

  if (!isPaystackReference(order.paystackReference)) {
    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: 'skipped',
      reason: 'Not a Paystack reference',
    }
  }

  try {
    const metadata = await fetchTransactionMetadata(order.paystackReference)
    const items = parseCheckoutLineItems(metadata.items)

    if (items.length === 0) {
      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: 'failed',
        reason: 'Paystack metadata had no recoverable items',
      }
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        items: items as Prisma.InputJsonValue,
      },
    })

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: 'recovered',
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    }
  } catch (error) {
    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: 'failed',
      reason:
        error instanceof Error ? error.message : 'Paystack lookup failed',
    }
  }
}

export async function backfillOrderItemsFromPaystack(options?: {
  orderId?: string
}): Promise<BackfillOrderItemsResult> {
  if (!isDatabaseConfigured()) {
    throw new Error('DATABASE_NOT_CONFIGURED')
  }
  if (!isPaystackConfigured()) {
    throw new Error('PAYSTACK_NOT_CONFIGURED')
  }

  const orders = options?.orderId
    ? await prisma.order.findMany({
        where: { id: options.orderId },
        select: {
          id: true,
          orderNumber: true,
          paystackReference: true,
          items: true,
        },
      })
    : await prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          paystackReference: true,
          items: true,
        },
      })

  const candidates = orders.filter((order) => !orderHasLineItems(order.items))
  const results: BackfillOrderItemsResult['results'] = []

  for (const [index, order] of candidates.entries()) {
    if (index > 0) await sleep(250)
    results.push(await recoverOrderItemsFromPaystack(order))
  }

  return {
    scanned: candidates.length,
    recovered: results.filter((result) => result.status === 'recovered').length,
    skipped: results.filter((result) => result.status === 'skipped').length,
    failed: results.filter((result) => result.status === 'failed').length,
    results,
  }
}
