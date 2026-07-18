import { isDatabaseConfigured } from '@/lib/env'
import { prisma } from '@/lib/prisma'

export const VISITOR_FUNNEL_EVENTS = [
  'add_to_cart',
  'checkout',
  'purchase',
] as const

export type VisitorFunnelEventName = (typeof VISITOR_FUNNEL_EVENTS)[number]

const FUNNEL_RETENTION_MS = 14 * 24 * 60 * 60 * 1000
export const FUNNEL_BUCKET_MS = 5 * 60 * 1000

const FUNNEL_LABELS: Record<VisitorFunnelEventName, string> = {
  add_to_cart: 'Add to cart',
  checkout: 'Checkout',
  purchase: 'Purchased',
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function startOfFiveMinutes(date: Date): Date {
  const bucket = new Date(date)
  bucket.setSeconds(0, 0)
  bucket.setMinutes(Math.floor(bucket.getMinutes() / 5) * 5)
  return bucket
}

export function isVisitorFunnelEvent(
  value: string,
): value is VisitorFunnelEventName {
  return (VISITOR_FUNNEL_EVENTS as readonly string[]).includes(value)
}

export async function recordVisitorFunnelEvent(input: {
  visitorId: string
  event: VisitorFunnelEventName
}): Promise<{ ok: true } | { ok: false }> {
  if (!isDatabaseConfigured()) return { ok: false }

  await prisma.visitorFunnelEvent.create({
    data: {
      visitorId: input.visitorId,
      event: input.event,
    },
  })

  return { ok: true }
}

export async function cleanupOldFunnelEvents(now = new Date()) {
  if (!isDatabaseConfigured()) return

  const cutoff = new Date(now.getTime() - FUNNEL_RETENTION_MS)
  await prisma.visitorFunnelEvent.deleteMany({
    where: { createdAt: { lt: cutoff } },
  })
}

export type FunnelShareRow = {
  key: VisitorFunnelEventName
  label: string
  count: number
  share: number
}

export type FunnelTrendPoint = {
  minute: string
  minuteLabel: string
  addToCart: number
  checkout: number
  purchase: number
}

/** Today's funnel totals. Purchased uses orders; ATC/checkout use events. */
export async function getTodayFunnelShare(now = new Date()): Promise<FunnelShareRow[]> {
  if (!isDatabaseConfigured()) {
    return VISITOR_FUNNEL_EVENTS.map((key) => ({
      key,
      label: FUNNEL_LABELS[key],
      count: 0,
      share: 0,
    }))
  }

  const todayStart = startOfDay(now)

  const [eventGroups, purchasedCount] = await Promise.all([
    prisma.visitorFunnelEvent.groupBy({
      by: ['event'],
      where: {
        createdAt: { gte: todayStart },
        event: { in: ['add_to_cart', 'checkout'] },
      },
      _count: { _all: true },
    }),
    prisma.order.count({
      where: { createdAt: { gte: todayStart } },
    }),
  ])

  const counts: Record<VisitorFunnelEventName, number> = {
    add_to_cart: 0,
    checkout: 0,
    purchase: purchasedCount,
  }

  for (const row of eventGroups) {
    if (isVisitorFunnelEvent(row.event) && row.event !== 'purchase') {
      counts[row.event] = row._count._all
    }
  }

  const total = Math.max(
    counts.add_to_cart + counts.checkout + counts.purchase,
    1,
  )

  return VISITOR_FUNNEL_EVENTS.map((key) => ({
    key,
    label: FUNNEL_LABELS[key],
    count: counts[key],
    share: Math.round((counts[key] / total) * 100),
  }))
}

/** Today’s funnel actions bucketed every 5 minutes. */
export async function getTodayFunnelTrend(
  now = new Date(),
): Promise<FunnelTrendPoint[]> {
  if (!isDatabaseConfigured()) return []

  const todayStart = startOfDay(now)
  const currentBucket = startOfFiveMinutes(now)

  const [events, orders] = await Promise.all([
    prisma.visitorFunnelEvent.findMany({
      where: {
        createdAt: { gte: todayStart },
        event: { in: ['add_to_cart', 'checkout'] },
      },
      select: { event: true, createdAt: true },
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: todayStart } },
      select: { createdAt: true },
    }),
  ])

  const buckets = new Map<
    number,
    { addToCart: number; checkout: number; purchase: number }
  >()

  for (
    let t = startOfFiveMinutes(todayStart).getTime();
    t <= currentBucket.getTime();
    t += FUNNEL_BUCKET_MS
  ) {
    buckets.set(t, { addToCart: 0, checkout: 0, purchase: 0 })
  }

  for (const event of events) {
    const key = startOfFiveMinutes(event.createdAt).getTime()
    const bucket = buckets.get(key)
    if (!bucket) continue
    if (event.event === 'add_to_cart') bucket.addToCart += 1
    if (event.event === 'checkout') bucket.checkout += 1
  }

  for (const order of orders) {
    const key = startOfFiveMinutes(order.createdAt).getTime()
    const bucket = buckets.get(key)
    if (bucket) bucket.purchase += 1
  }

  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([time, counts]) => {
      const date = new Date(time)
      return {
        minute: date.toISOString(),
        minuteLabel: date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        }),
        addToCart: counts.addToCart,
        checkout: counts.checkout,
        purchase: counts.purchase,
      }
    })
}
