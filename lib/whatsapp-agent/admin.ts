import { prisma } from '@/lib/prisma'
import { getWhatsappAgentConfig } from '@/lib/whatsapp-agent/config'
import { sendTextMessage } from '@/lib/whatsapp-agent/whatsapp'
import * as store from '@/lib/whatsapp-agent/store'

export type WaAdminThreadSummary = {
  whatsappId: string
  displayName: string | null
  aiPaused: boolean
  aiPausedReason: string | null
  lastMessageAt: string
  lastMessagePreview: string
  lastMessageRole: string
  openHandoffs: number
}

export async function listWhatsappAdminThreads(
  limit = 80,
): Promise<WaAdminThreadSummary[]> {
  const customers = await prisma.waAgentCustomer.findMany({
    orderBy: { updatedAt: 'desc' },
    take: Math.min(Math.max(limit, 1), 200),
  })

  const threads: WaAdminThreadSummary[] = []
  for (const customer of customers) {
    const last = await prisma.waAgentMessage.findFirst({
      where: { whatsappId: customer.whatsappId },
      orderBy: { createdAt: 'desc' },
    })
    if (!last) continue
    const openHandoffs = await prisma.waAgentHandoff.count({
      where: { whatsappId: customer.whatsappId, status: 'Open' },
    })
    threads.push({
      whatsappId: customer.whatsappId,
      displayName: customer.displayName,
      aiPaused: Boolean(customer.aiPaused),
      aiPausedReason: customer.aiPausedReason,
      lastMessageAt: last.createdAt.toISOString(),
      lastMessagePreview: last.content.slice(0, 120),
      lastMessageRole: last.role,
      openHandoffs,
    })
  }

  threads.sort(
    (a, b) =>
      Date.parse(b.lastMessageAt) - Date.parse(a.lastMessageAt),
  )
  return threads
}

export async function getWhatsappAdminThread(whatsappId: string) {
  const customer = await prisma.waAgentCustomer.findUnique({
    where: { whatsappId },
  })
  if (!customer) return null

  const messages = await prisma.waAgentMessage.findMany({
    where: { whatsappId },
    orderBy: { createdAt: 'asc' },
    take: 200,
  })
  const cart = await store.getCart(whatsappId)
  const handoffs = await prisma.waAgentHandoff.findMany({
    where: { whatsappId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })
  const recentOrders = await prisma.waAgentOrder.findMany({
    where: { whatsappId },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  return {
    customer: {
      whatsappId: customer.whatsappId,
      displayName: customer.displayName,
      alternatePhone: customer.alternatePhone,
      notes: customer.notes,
      aiPaused: Boolean(customer.aiPaused),
      aiPausedAt: customer.aiPausedAt?.toISOString() ?? null,
      aiPausedReason: customer.aiPausedReason,
      updatedAt: customer.updatedAt.toISOString(),
    },
    messages: messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    })),
    cart,
    handoffs: handoffs.map((h) => ({
      id: h.id,
      reason: h.reason,
      summary: h.summary,
      urgency: h.urgency,
      status: h.status,
      createdAt: h.createdAt.toISOString(),
    })),
    orders: recentOrders.map((o) => ({
      orderId: o.orderId,
      totalGhs: o.totalGhs,
      orderStatus: o.orderStatus,
      createdAt: o.createdAt.toISOString(),
    })),
  }
}

export async function setWhatsappAiPaused(
  whatsappId: string,
  paused: boolean,
  reason?: string | null,
) {
  const updated = await store.setCustomerAiPaused(whatsappId, paused, reason)
  if (paused) {
    await prisma.waAgentHandoff.updateMany({
      where: { whatsappId, status: 'Open' },
      data: { status: 'In progress' },
    })
  } else {
    await prisma.waAgentHandoff.updateMany({
      where: { whatsappId, status: { in: ['Open', 'In progress'] } },
      data: { status: 'Resolved' },
    })
  }
  return updated
}

export async function sendWhatsappStaffReply(
  whatsappId: string,
  body: string,
) {
  const text = String(body || '').trim().slice(0, 4096)
  if (!text) throw new Error('Message is required.')

  const config = getWhatsappAgentConfig()
  if (!config.meta.accessToken || !config.meta.phoneNumberId) {
    throw new Error('WhatsApp Cloud API credentials are not configured.')
  }

  await store.ensureCustomer(whatsappId)
  await sendTextMessage(whatsappId, text, config.meta)
  await store.saveMessage({
    whatsappId,
    role: 'staff',
    content: text,
  })
  // Keep AI paused after a manual reply unless staff resumes.
  await store.setCustomerAiPaused(
    whatsappId,
    true,
    'Staff replied manually',
  )

  return { sent: true }
}

export async function sendWhatsappPaymentLink(whatsappId: string) {
  const config = getWhatsappAgentConfig()
  if (!config.meta.accessToken || !config.meta.phoneNumberId) {
    throw new Error('WhatsApp Cloud API credentials are not configured.')
  }

  const order = await store.getLatestOrderForCustomer(whatsappId)
  if (!order) {
    throw new Error('No WhatsApp order found for this customer.')
  }

  const {
    ensureWhatsappPaystackLink,
    formatPaymentLinkMessage,
  } = await import('@/lib/whatsapp-agent/payment-link')

  const result = await ensureWhatsappPaystackLink(order)
  if (!result.ok) {
    throw new Error(result.reason)
  }

  const message = formatPaymentLinkMessage(order, result.authorizationUrl)
  await sendTextMessage(whatsappId, message, config.meta)
  await store.saveMessage({
    whatsappId,
    role: 'staff',
    content: message,
  })
  await store.setCustomerAiPaused(
    whatsappId,
    true,
    'Staff sent payment link',
  )

  return {
    sent: true,
    orderId: order.order_id,
    paymentUrl: result.authorizationUrl,
    reference: result.reference,
  }
}
