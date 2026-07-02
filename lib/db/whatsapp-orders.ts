import { randomBytes } from 'crypto'
import { getAppUrl } from '@/lib/env'
import { prisma } from '@/lib/prisma'
import {
  getWhatsappOrderSharePath,
  type WhatsappOrderSnapshot,
} from '@/lib/whatsapp-order-types'

const WHATSAPP_ORDER_TTL_DAYS = 14

export function createWhatsappOrderPublicId(): string {
  return `wo_${randomBytes(8).toString('hex')}`
}

export function getWhatsappOrderShareUrl(orderId: string): string {
  return `${getAppUrl()}${getWhatsappOrderSharePath(orderId)}`
}

export async function createWhatsappOrder(snapshot: WhatsappOrderSnapshot) {
  const orderId = createWhatsappOrderPublicId()
  const expiresAt = new Date(
    Date.now() + WHATSAPP_ORDER_TTL_DAYS * 24 * 60 * 60 * 1000,
  )

  await prisma.whatsappOrder.create({
    data: {
      orderId,
      payload: snapshot,
      expiresAt,
    },
  })

  return {
    orderId,
    shareUrl: getWhatsappOrderShareUrl(orderId),
    expiresAt,
  }
}

export async function getWhatsappOrder(orderId: string) {
  const record = await prisma.whatsappOrder.findUnique({
    where: { orderId },
  })

  if (!record) return null
  if (record.expiresAt.getTime() < Date.now()) return null

  return {
    orderId: record.orderId,
    payload: record.payload as WhatsappOrderSnapshot,
    createdAt: record.createdAt,
    expiresAt: record.expiresAt,
  }
}
