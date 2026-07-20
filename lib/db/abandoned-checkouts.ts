import type { Prisma } from '@prisma/client'
import { isDatabaseConfigured } from '@/lib/env'
import { prisma } from '@/lib/prisma'
import type { CheckoutLineItem } from '@/lib/checkout'

export const ABANDONED_CHECKOUT_GRACE_MS = 5 * 60 * 1000
export const ABANDONED_CHECKOUT_RETENTION_MS = 14 * 24 * 60 * 60 * 1000

export type AbandonedCheckoutStatus = 'active' | 'recovered' | 'expired'

export type UpsertAbandonedCheckoutInput = {
  visitorId: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  shippingAddress?: string
  locationId: string
  items: CheckoutLineItem[]
  subtotal: number
  shipping: number
  discount: number
  total: number
  currency: string
  promoCode?: string
  affiliateCode?: string
}

export type AdminAbandonedCheckoutRow = {
  id: string
  visitorId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  shippingAddress: string
  locationId: string
  items: CheckoutLineItem[]
  itemCount: number
  subtotal: number
  shipping: number
  discount: number
  total: number
  currency: string
  promoCode: string | null
  affiliateCode: string | null
  status: AbandonedCheckoutStatus
  startedAt: string
  lastSeenAt: string
  recoveredAt: string | null
  abandonedMinutes: number
  hasContact: boolean
}

export type AdminAbandonedCheckoutsPayload = {
  checkouts: AdminAbandonedCheckoutRow[]
  summary: {
    total: number
    withEmail: number
    totalValue: number
    totalValueCurrency: string | null
    today: number
  }
  graceMinutes: number
  refreshedAt: string
}

function normalizeContact(value: string | undefined): string {
  return value?.trim() ?? ''
}

function normalizeEmail(value: string | undefined): string {
  return normalizeContact(value).toLowerCase()
}

function mapRow(
  row: {
    id: string
    visitorId: string
    customerName: string
    customerEmail: string
    customerPhone: string
    shippingAddress: string
    locationId: string
    items: unknown
    itemCount: number
    subtotal: number
    shipping: number
    discount: number
    total: number
    currency: string
    promoCode: string | null
    affiliateCode: string | null
    status: string
    startedAt: Date
    lastSeenAt: Date
    recoveredAt: Date | null
  },
  now = new Date(),
): AdminAbandonedCheckoutRow {
  const email = normalizeEmail(row.customerEmail)
  const phone = normalizeContact(row.customerPhone)
  const name = normalizeContact(row.customerName)
  const abandonedMinutes = Math.max(
    0,
    Math.floor((now.getTime() - row.lastSeenAt.getTime()) / 60_000),
  )

  return {
    id: row.id,
    visitorId: row.visitorId,
    customerName: name,
    customerEmail: email,
    customerPhone: phone,
    shippingAddress: normalizeContact(row.shippingAddress),
    locationId: row.locationId,
    items: (Array.isArray(row.items) ? row.items : []) as CheckoutLineItem[],
    itemCount: row.itemCount,
    subtotal: row.subtotal,
    shipping: row.shipping,
    discount: row.discount,
    total: row.total,
    currency: row.currency,
    promoCode: row.promoCode,
    affiliateCode: row.affiliateCode,
    status: row.status as AbandonedCheckoutStatus,
    startedAt: row.startedAt.toISOString(),
    lastSeenAt: row.lastSeenAt.toISOString(),
    recoveredAt: row.recoveredAt?.toISOString() ?? null,
    abandonedMinutes,
    hasContact: Boolean(email || phone || name),
  }
}

export async function upsertAbandonedCheckout(
  input: UpsertAbandonedCheckoutInput,
): Promise<{ ok: true } | { ok: false }> {
  if (!isDatabaseConfigured()) return { ok: false }

  const visitorId = input.visitorId.trim()
  if (!visitorId) return { ok: false }

  const now = new Date()
  const itemCount = input.items.reduce((sum, item) => sum + item.quantity, 0)
  const customerName = normalizeContact(input.customerName)
  const customerEmail = normalizeEmail(input.customerEmail)
  const customerPhone = normalizeContact(input.customerPhone)
  const shippingAddress = normalizeContact(input.shippingAddress)

  const existing = await prisma.abandonedCheckout.findUnique({
    where: { visitorId },
    select: {
      customerName: true,
      customerEmail: true,
      customerPhone: true,
      shippingAddress: true,
    },
  })

  // Keep previously captured contact if a later draft arrives before the
  // shopper re-types the fields (or with blank inputs).
  const nextName = customerName || existing?.customerName || ''
  const nextEmail = customerEmail || existing?.customerEmail || ''
  const nextPhone = customerPhone || existing?.customerPhone || ''
  const nextAddress = shippingAddress || existing?.shippingAddress || ''

  await prisma.abandonedCheckout.upsert({
    where: { visitorId },
    create: {
      visitorId,
      customerName: nextName,
      customerEmail: nextEmail,
      customerPhone: nextPhone,
      shippingAddress: nextAddress,
      locationId: input.locationId,
      items: input.items as Prisma.InputJsonValue,
      itemCount,
      subtotal: input.subtotal,
      shipping: input.shipping,
      discount: input.discount,
      total: input.total,
      currency: input.currency,
      promoCode: input.promoCode?.trim() || null,
      affiliateCode: input.affiliateCode?.trim() || null,
      status: 'active',
      startedAt: now,
      lastSeenAt: now,
    },
    update: {
      customerName: nextName,
      customerEmail: nextEmail,
      customerPhone: nextPhone,
      shippingAddress: nextAddress,
      locationId: input.locationId,
      items: input.items as Prisma.InputJsonValue,
      itemCount,
      subtotal: input.subtotal,
      shipping: input.shipping,
      discount: input.discount,
      total: input.total,
      currency: input.currency,
      promoCode: input.promoCode?.trim() || null,
      affiliateCode: input.affiliateCode?.trim() || null,
      status: 'active',
      lastSeenAt: now,
    },
  })

  return { ok: true }
}

export async function markCheckoutRecovered(input: {
  visitorId?: string
  customerEmail?: string
}) {
  if (!isDatabaseConfigured()) return

  const visitorId = input.visitorId?.trim()
  const email = normalizeEmail(input.customerEmail)
  const now = new Date()

  const updates: Promise<unknown>[] = []

  if (visitorId) {
    updates.push(
      prisma.abandonedCheckout.updateMany({
        where: { visitorId, status: 'active' },
        data: { status: 'recovered', recoveredAt: now },
      }),
    )
  }

  if (email) {
    updates.push(
      prisma.abandonedCheckout.updateMany({
        where: {
          status: 'active',
          customerEmail: email,
        },
        data: { status: 'recovered', recoveredAt: now },
      }),
    )
  }

  if (updates.length > 0) {
    await Promise.all(updates)
  }
}

export async function cleanupExpiredAbandonedCheckouts(now = new Date()) {
  if (!isDatabaseConfigured()) return

  const cutoff = new Date(now.getTime() - ABANDONED_CHECKOUT_RETENTION_MS)
  await prisma.abandonedCheckout.updateMany({
    where: {
      status: 'active',
      lastSeenAt: { lt: cutoff },
    },
    data: { status: 'expired' },
  })

  await prisma.abandonedCheckout.deleteMany({
    where: {
      status: { in: ['recovered', 'expired'] },
      lastSeenAt: { lt: cutoff },
    },
  })
}

export async function getAdminAbandonedCheckouts(
  now = new Date(),
): Promise<AdminAbandonedCheckoutsPayload> {
  const empty: AdminAbandonedCheckoutsPayload = {
    checkouts: [],
    summary: { total: 0, withEmail: 0, totalValue: 0, totalValueCurrency: null, today: 0 },
    graceMinutes: ABANDONED_CHECKOUT_GRACE_MS / 60_000,
    refreshedAt: now.toISOString(),
  }

  if (!isDatabaseConfigured()) return empty

  await cleanupExpiredAbandonedCheckouts(now)

  const graceCutoff = new Date(now.getTime() - ABANDONED_CHECKOUT_GRACE_MS)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const rows = await prisma.abandonedCheckout.findMany({
    where: {
      status: 'active',
      lastSeenAt: { lt: graceCutoff },
    },
    orderBy: { lastSeenAt: 'desc' },
    take: 100,
  })

  const checkouts = rows.map((row) => mapRow(row, now))
  const withEmail = checkouts.filter((row) => row.customerEmail).length
  const totalValue = checkouts.reduce((sum, row) => sum + row.total, 0)
  const primaryCurrency = checkouts[0]?.currency ?? 'GHS'
  const mixedCurrencies = checkouts.some(
    (row) => row.currency !== primaryCurrency,
  )
  const today = checkouts.filter(
    (row) => new Date(row.startedAt) >= todayStart,
  ).length

  return {
    checkouts,
    summary: {
      total: checkouts.length,
      withEmail,
      totalValue: mixedCurrencies ? 0 : totalValue,
      totalValueCurrency: mixedCurrencies ? null : primaryCurrency,
      today,
    },
    graceMinutes: ABANDONED_CHECKOUT_GRACE_MS / 60_000,
    refreshedAt: now.toISOString(),
  }
}
