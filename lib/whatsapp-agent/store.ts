import { prisma } from '@/lib/prisma'
import type {
  WaCartItem,
  WaCartRecord,
  WaConversationMessage,
  WaCustomerRecord,
  WaHandoffRecord,
  WaOrderItem,
  WaOrderRecord,
} from '@/lib/whatsapp-agent/types'

function asCartItems(value: unknown): WaCartItem[] {
  if (!Array.isArray(value)) return []
  return value as WaCartItem[]
}

function asOrderItems(value: unknown): WaOrderItem[] {
  if (!Array.isArray(value)) return []
  return value as WaOrderItem[]
}

function mapCustomer(doc: {
  whatsappId: string
  displayName: string | null
  alternatePhone: string | null
  notes: string | null
  aiPaused?: boolean | null
  aiPausedAt?: Date | null
  aiPausedReason?: string | null
}): WaCustomerRecord {
  return {
    whatsapp_id: doc.whatsappId,
    display_name: doc.displayName,
    alternate_phone: doc.alternatePhone,
    notes: doc.notes,
    ai_paused: Boolean(doc.aiPaused),
    ai_paused_at: doc.aiPausedAt?.toISOString() ?? null,
    ai_paused_reason: doc.aiPausedReason ?? null,
  }
}

function mapCart(doc: {
  whatsappId: string
  deliveryArea: string | null
  landmark: string | null
  latitude: number | null
  longitude: number | null
  locationUrl: string | null
  paymentMethod: string | null
  paymentNotes: string | null
  orderNotes: string | null
  items: unknown
}): WaCartRecord {
  return {
    whatsapp_id: doc.whatsappId,
    delivery_area: doc.deliveryArea,
    landmark: doc.landmark,
    latitude: doc.latitude,
    longitude: doc.longitude,
    location_url: doc.locationUrl,
    payment_method: doc.paymentMethod,
    payment_notes: doc.paymentNotes,
    order_notes: doc.orderNotes,
    items: asCartItems(doc.items),
  }
}

function mapOrder(doc: {
  orderId: string
  whatsappId: string
  customerName: string
  alternatePhone: string | null
  deliveryArea: string
  landmark: string | null
  latitude: number | null
  longitude: number | null
  locationUrl: string | null
  paymentMethod: string
  paymentStatus: string
  paymentLink?: string | null
  paymentReference?: string | null
  subtotalGhs: number
  deliveryFeeGhs: number
  totalGhs: number
  orderStatus: string
  notes: string | null
  customerConfirmed: boolean
  excelSyncStatus: string
  excelSyncError: string | null
  createdAt: Date
  updatedAt: Date
  items: unknown
}): WaOrderRecord {
  return {
    order_id: doc.orderId,
    whatsapp_id: doc.whatsappId,
    customer_name: doc.customerName,
    alternate_phone: doc.alternatePhone,
    delivery_area: doc.deliveryArea,
    landmark: doc.landmark,
    latitude: doc.latitude,
    longitude: doc.longitude,
    location_url: doc.locationUrl,
    payment_method: doc.paymentMethod,
    payment_status: doc.paymentStatus,
    payment_link: doc.paymentLink ?? null,
    payment_reference: doc.paymentReference ?? null,
    subtotal_ghs: doc.subtotalGhs,
    delivery_fee_ghs: doc.deliveryFeeGhs,
    total_ghs: doc.totalGhs,
    order_status: doc.orderStatus,
    notes: doc.notes,
    customer_confirmed: doc.customerConfirmed,
    excel_sync_status: doc.excelSyncStatus,
    excel_sync_error: doc.excelSyncError,
    created_at: doc.createdAt.toISOString(),
    updated_at: doc.updatedAt.toISOString(),
    items: asOrderItems(doc.items),
  }
}

/** Returns true if this is the first time seeing the event (not a duplicate). */
export async function markEventProcessed(eventId: string | null | undefined) {
  if (!eventId) return true
  try {
    await prisma.waAgentProcessedEvent.create({
      data: { eventId },
    })
    return true
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return false
    }
    throw error
  }
}

export async function markReplySent(eventId: string | null | undefined) {
  if (!eventId) return
  try {
    await prisma.waAgentProcessedEvent.update({
      where: { eventId },
      data: { replySentAt: new Date() },
    })
  } catch {
    // Event may be missing for simulations without ids — ignore.
  }
}

export async function wasReplySent(eventId: string | null | undefined) {
  if (!eventId) return false
  const row = await prisma.waAgentProcessedEvent.findUnique({
    where: { eventId },
  })
  return Boolean(row?.replySentAt)
}

export async function ensureCustomer(
  whatsappId: string,
  displayName: string | null = null,
) {
  const existing = await prisma.waAgentCustomer.findUnique({
    where: { whatsappId },
  })
  if (existing) {
    if (displayName && displayName !== existing.displayName) {
      const updated = await prisma.waAgentCustomer.update({
        where: { whatsappId },
        data: { displayName },
      })
      await ensureCart(whatsappId)
      return mapCustomer(updated)
    }
    await ensureCart(whatsappId)
    return mapCustomer(existing)
  }
  const created = await prisma.waAgentCustomer.create({
    data: { whatsappId, displayName },
  })
  await ensureCart(whatsappId)
  return mapCustomer(created)
}

export async function getCustomer(whatsappId: string) {
  const doc = await prisma.waAgentCustomer.findUnique({ where: { whatsappId } })
  return doc ? mapCustomer(doc) : null
}

export async function updateCustomer(
  whatsappId: string,
  details: {
    name?: string | null
    alternate_phone?: string | null
    notes?: string | null
  },
) {
  await ensureCustomer(whatsappId)
  const updated = await prisma.waAgentCustomer.update({
    where: { whatsappId },
    data: {
      displayName: details.name ?? null,
      alternatePhone: details.alternate_phone ?? null,
      notes: details.notes ?? null,
    },
  })
  return mapCustomer(updated)
}

export async function saveMessage({
  whatsappId,
  role,
  content,
  externalMessageId = null,
}: {
  whatsappId: string
  role: 'user' | 'assistant' | 'staff'
  content: string
  externalMessageId?: string | null
}) {
  await prisma.waAgentMessage.create({
    data: {
      whatsappId,
      role,
      content,
      externalMessageId,
    },
  })
  await prisma.waAgentCustomer
    .update({
      where: { whatsappId },
      data: { updatedAt: new Date() },
    })
    .catch(() => undefined)
}

export async function setCustomerAiPaused(
  whatsappId: string,
  paused: boolean,
  reason?: string | null,
) {
  await ensureCustomer(whatsappId)
  const updated = await prisma.waAgentCustomer.update({
    where: { whatsappId },
    data: {
      aiPaused: paused,
      aiPausedAt: paused ? new Date() : null,
      aiPausedReason: paused ? reason || 'Paused by staff' : null,
    },
  })
  return mapCustomer(updated)
}

export async function getConversation(
  whatsappId: string,
  limit = 20,
): Promise<WaConversationMessage[]> {
  const rows = await prisma.waAgentMessage.findMany({
    where: {
      whatsappId,
      role: { in: ['user', 'assistant', 'staff'] },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
  return rows.reverse().map((row) => ({
    role: row.role === 'user' ? 'user' : 'assistant',
    content:
      row.role === 'staff' ? `[Staff reply] ${row.content}` : row.content,
    created_at: row.createdAt.toISOString(),
  }))
}

export async function getLatestAssistantMessage(whatsappId: string) {
  const row = await prisma.waAgentMessage.findFirst({
    where: { whatsappId, role: 'assistant' },
    orderBy: { createdAt: 'desc' },
  })
  if (!row) return null
  return {
    content: row.content,
    created_at: row.createdAt.toISOString(),
  }
}

export async function ensureCart(whatsappId: string) {
  const existing = await prisma.waAgentCart.findUnique({ where: { whatsappId } })
  if (existing) return mapCart(existing)
  const created = await prisma.waAgentCart.create({
    data: { whatsappId, items: [] },
  })
  return mapCart(created)
}

export async function setCartItems(whatsappId: string, items: WaCartItem[]) {
  await ensureCart(whatsappId)
  const updated = await prisma.waAgentCart.update({
    where: { whatsappId },
    data: { items },
  })
  return mapCart(updated)
}

export async function setDelivery(
  whatsappId: string,
  details: {
    area: string
    landmark?: string | null
    latitude?: number | null
    longitude?: number | null
    location_url?: string | null
  },
) {
  await ensureCart(whatsappId)
  const updated = await prisma.waAgentCart.update({
    where: { whatsappId },
    data: {
      deliveryArea: details.area,
      landmark: details.landmark ?? null,
      latitude: details.latitude ?? null,
      longitude: details.longitude ?? null,
      locationUrl: details.location_url ?? null,
    },
  })
  return mapCart(updated)
}

export async function setPayment(
  whatsappId: string,
  method: string,
  notes: string | null = null,
) {
  await ensureCart(whatsappId)
  const updated = await prisma.waAgentCart.update({
    where: { whatsappId },
    data: {
      paymentMethod: method,
      paymentNotes: notes,
    },
  })
  return mapCart(updated)
}

export async function getCart(whatsappId: string) {
  return ensureCart(whatsappId)
}

export async function saveOrder(order: {
  order_id: string
  whatsapp_id: string
  customer_name: string
  alternate_phone: string | null
  delivery_area: string
  landmark: string | null
  latitude: number | null
  longitude: number | null
  location_url: string | null
  payment_method: string
  payment_status: string
  subtotal_ghs: number
  delivery_fee_ghs: number
  total_ghs: number
  order_status: string
  notes: string | null
  created_at: string
  items: WaOrderItem[]
}) {
  const created = await prisma.waAgentOrder.create({
    data: {
      orderId: order.order_id,
      whatsappId: order.whatsapp_id,
      customerName: order.customer_name,
      alternatePhone: order.alternate_phone,
      deliveryArea: order.delivery_area,
      landmark: order.landmark,
      latitude: order.latitude,
      longitude: order.longitude,
      locationUrl: order.location_url,
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
      subtotalGhs: order.subtotal_ghs,
      deliveryFeeGhs: order.delivery_fee_ghs,
      totalGhs: order.total_ghs,
      orderStatus: order.order_status,
      notes: order.notes,
      customerConfirmed: true,
      excelSyncStatus: 'Pending',
      items: order.items,
      createdAt: new Date(order.created_at),
    },
  })
  await prisma.waAgentCart.update({
    where: { whatsappId: order.whatsapp_id },
    data: {
      items: [],
      deliveryArea: null,
      landmark: null,
      latitude: null,
      longitude: null,
      locationUrl: null,
      paymentMethod: null,
      paymentNotes: null,
      orderNotes: null,
    },
  })
  return mapOrder(created)
}

export async function getOrder(orderId: string) {
  const doc = await prisma.waAgentOrder.findUnique({ where: { orderId } })
  return doc ? mapOrder(doc) : null
}

export async function getLatestOrderForCustomer(whatsappId: string) {
  const doc = await prisma.waAgentOrder.findFirst({
    where: { whatsappId },
    orderBy: { createdAt: 'desc' },
  })
  return doc ? mapOrder(doc) : null
}

export async function attachOrderPaymentLink(
  orderId: string,
  details: { paymentLink: string; paymentReference: string },
) {
  const updated = await prisma.waAgentOrder.update({
    where: { orderId },
    data: {
      paymentLink: details.paymentLink,
      paymentReference: details.paymentReference,
      paymentStatus: 'Awaiting payment',
    },
  })
  return mapOrder(updated)
}

export async function markWaOrderPaidByReference(reference: string) {
  const doc = await prisma.waAgentOrder.findFirst({
    where: { paymentReference: reference },
  })
  if (!doc) return null
  if (doc.paymentStatus === 'Paid') return mapOrder(doc)
  const updated = await prisma.waAgentOrder.update({
    where: { orderId: doc.orderId },
    data: { paymentStatus: 'Paid' },
  })
  return mapOrder(updated)
}

export async function listOrders(limit = 100) {
  const rows = await prisma.waAgentOrder.findMany({
    orderBy: { createdAt: 'desc' },
    take: Math.min(Math.max(limit, 1), 500),
  })
  return rows.map(mapOrder)
}

export async function setExcelSync(
  orderId: string,
  status: string,
  error: string | null = null,
) {
  await prisma.waAgentOrder.update({
    where: { orderId },
    data: {
      excelSyncStatus: status,
      excelSyncError: error,
    },
  })
}

export async function createHandoff({
  whatsappId,
  reason,
  summary = null,
  urgency = 'normal',
}: {
  whatsappId: string
  reason: string
  summary?: string | null
  urgency?: string
}): Promise<WaHandoffRecord> {
  const doc = await prisma.waAgentHandoff.create({
    data: {
      whatsappId,
      reason,
      summary,
      urgency,
    },
  })
  return {
    id: doc.id,
    whatsapp_id: doc.whatsappId,
    reason: doc.reason,
    summary: doc.summary,
    urgency: doc.urgency,
    status: doc.status,
    created_at: doc.createdAt.toISOString(),
  }
}
