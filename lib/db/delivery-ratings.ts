import type { DeliveryRating as PrismaDeliveryRating } from '@prisma/client'
import { isDatabaseConfigured } from '@/lib/env'
import { asDhlShipmentRecord } from '@/lib/dhl/record'
import { normalizeDhlTrackingNumber } from '@/lib/dhl/checkpoints'
import { prisma } from '@/lib/prisma'

export type DeliveryRatingRecord = {
  ratingId: string
  trackingNumber: string
  orderId?: string
  orderNumber?: string
  rating: number
  comment: string
  customerName: string
  customerEmail: string
  createdAt: string
}

function toRecord(row: PrismaDeliveryRating): DeliveryRatingRecord {
  return {
    ratingId: row.ratingId,
    trackingNumber: row.trackingNumber,
    orderId: row.orderId || undefined,
    orderNumber: row.orderNumber || undefined,
    rating: row.rating,
    comment: row.comment,
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    createdAt: row.createdAt.toISOString(),
  }
}

export function generateDeliveryRatingId(): string {
  const suffix = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `DR-${suffix}-${rand}`
}

export async function findDeliveryRatingByTracking(
  rawTrackingNumber: string,
): Promise<DeliveryRatingRecord | null> {
  if (!isDatabaseConfigured()) return null
  const trackingNumber = normalizeDhlTrackingNumber(rawTrackingNumber)
  if (!trackingNumber) return null

  const row = await prisma.deliveryRating.findUnique({
    where: { trackingNumber },
  })
  return row ? toRecord(row) : null
}

export async function findOrderByTrackingNumber(rawTrackingNumber: string): Promise<{
  orderId: string
  orderNumber: string
  customerName: string
  customerEmail: string
  fulfillmentStatus: string
} | null> {
  if (!isDatabaseConfigured()) return null
  const trackingNumber = normalizeDhlTrackingNumber(rawTrackingNumber)
  if (!trackingNumber) return null

  const candidates = await prisma.order.findMany({
    where: {
      OR: [
        { fulfillmentStatus: 'Shipped' },
        { fulfillmentStatus: 'Delivered' },
        { fulfillmentStatus: 'Fulfilled' },
      ],
    },
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      customerEmail: true,
      fulfillmentStatus: true,
      dhl: true,
    },
    orderBy: { updatedAt: 'desc' },
    take: 400,
  })

  for (const order of candidates) {
    const dhl = asDhlShipmentRecord(order.dhl)
    const stored = normalizeDhlTrackingNumber(dhl?.trackingNumber ?? '')
    if (stored && stored === trackingNumber) {
      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        fulfillmentStatus: order.fulfillmentStatus,
      }
    }
  }

  return null
}

export async function createDeliveryRating(input: {
  trackingNumber: string
  rating: number
  comment?: string
  customerName?: string
  customerEmail?: string
}): Promise<DeliveryRatingRecord> {
  if (!isDatabaseConfigured()) {
    throw new Error('DATABASE_NOT_CONFIGURED')
  }

  const trackingNumber = normalizeDhlTrackingNumber(input.trackingNumber)
  if (!trackingNumber) {
    throw new Error('INVALID_TRACKING_NUMBER')
  }

  const rating = Math.round(input.rating)
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    throw new Error('INVALID_RATING')
  }

  const existing = await prisma.deliveryRating.findUnique({
    where: { trackingNumber },
  })
  if (existing) {
    throw new Error('ALREADY_RATED')
  }

  const order = await findOrderByTrackingNumber(trackingNumber)
  const row = await prisma.deliveryRating.create({
    data: {
      ratingId: generateDeliveryRatingId(),
      trackingNumber,
      orderId: order?.orderId,
      orderNumber: order?.orderNumber,
      rating,
      comment: (input.comment ?? '').trim().slice(0, 1000),
      customerName:
        (input.customerName ?? '').trim().slice(0, 120) ||
        order?.customerName ||
        '',
      customerEmail:
        (input.customerEmail ?? '').trim().toLowerCase().slice(0, 200) ||
        order?.customerEmail ||
        '',
    },
  })

  if (order && order.fulfillmentStatus !== 'Delivered') {
    await prisma.order.update({
      where: { id: order.orderId },
      data: { fulfillmentStatus: 'Delivered' },
    })
  }

  return toRecord(row)
}
