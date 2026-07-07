import type { LiveVisitorsPayload } from '@/lib/admin/live-visitors-types'
import { isDatabaseConfigured } from '@/lib/env'
import { prisma } from '@/lib/prisma'
import {
  getVisitorLocationDisplayLabel,
  getVisitorLocationFlag,
  resolveVisitorLocation,
} from '@/lib/visitor-location'

export const LIVE_VISITOR_WINDOW_MS = 2 * 60 * 1000
const STALE_CLEANUP_MS = 30 * 60 * 1000

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function formatVisitorPath(path: string): string {
  const normalized = path.split('?')[0]?.trim() || '/'
  if (normalized === '/') return 'Home'
  if (normalized === '/shop') return 'Shop'
  if (normalized === '/cart') return 'Cart'
  if (normalized === '/checkout') return 'Checkout'
  if (normalized.startsWith('/collections')) return 'Collections'
  if (normalized.startsWith('/product/')) {
    const slug = normalized.replace('/product/', '').replace(/-/g, ' ')
    return slug ? `Product · ${slug}` : 'Product'
  }
  if (normalized.startsWith('/admin')) return 'Admin'
  if (normalized.startsWith('/ai')) return 'Gelos AI'
  return normalized.replace(/^\//, '').replace(/-/g, ' ') || 'Page'
}

function formatReferrerLabel(referrer: string): string {
  const value = referrer.trim()
  if (!value) return 'Direct'
  try {
    const host = new URL(value).hostname.replace(/^www\./, '')
    return host || 'Direct'
  } catch {
    return 'Direct'
  }
}

function formatLastSeenLabel(lastSeenAt: Date, now = new Date()): string {
  const seconds = Math.max(0, Math.floor((now.getTime() - lastSeenAt.getTime()) / 1000))
  if (seconds < 15) return 'Just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  return `${minutes}m ago`
}

function locationGroupKey(session: {
  locationId: string
  country: string
  locationLabel: string
}): string {
  const locationId = session.locationId?.trim()
  if (locationId) return `id:${locationId}`
  const country = session.country?.trim()
  if (country) return `country:${country.toLowerCase()}`
  return `label:${session.locationLabel?.trim() || 'unknown'}`
}

export async function countSessionsInRange(start: Date, end: Date): Promise<number> {
  if (!isDatabaseConfigured()) return 0

  return prisma.visitorSession.count({
    where: {
      lastSeenAt: {
        gte: start,
        lt: end,
      },
    },
  })
}

export async function upsertVisitorHeartbeat(input: {
  visitorId: string
  path: string
  referrer?: string
  locationId?: string
  geoCity?: string
  geoCountry?: string
}) {
  if (!isDatabaseConfigured()) {
    return { ok: false as const, reason: 'no_database' as const }
  }

  const visitorId = input.visitorId.trim()
  if (!visitorId || visitorId.length > 120) {
    return { ok: false as const, reason: 'invalid_visitor' as const }
  }

  const path = input.path.trim().slice(0, 500) || '/'
  const referrer = input.referrer?.trim().slice(0, 500) ?? ''
  const location = resolveVisitorLocation({
    locationId: input.locationId,
    geoCity: input.geoCity,
    geoCountry: input.geoCountry,
  })
  const now = new Date()

  await prisma.visitorSession.upsert({
    where: { visitorId },
    create: {
      visitorId,
      path,
      referrer,
      locationId: location.locationId ?? '',
      city: location.city,
      country: location.country,
      locationLabel: location.label,
      firstSeenAt: now,
      lastSeenAt: now,
    },
    update: {
      path,
      referrer,
      locationId: location.locationId ?? '',
      city: location.city,
      country: location.country,
      locationLabel: location.label,
      lastSeenAt: now,
    },
  })

  return { ok: true as const }
}

async function cleanupStaleSessions(now = new Date()) {
  if (!isDatabaseConfigured()) return

  const cutoff = new Date(now.getTime() - STALE_CLEANUP_MS)
  await prisma.visitorSession.deleteMany({
    where: { lastSeenAt: { lt: cutoff } },
  })
}

export async function getLiveVisitors(): Promise<LiveVisitorsPayload> {
  const now = new Date()
  const activeCutoff = new Date(now.getTime() - LIVE_VISITOR_WINDOW_MS)
  const todayStart = startOfDay(now)

  if (!isDatabaseConfigured()) {
    return {
      liveCount: 0,
      todayVisitors: 0,
      activePages: [],
      activeLocations: [],
      sessions: [],
      activeWindowSeconds: LIVE_VISITOR_WINDOW_MS / 1000,
      refreshedAt: now.toISOString(),
    }
  }

  await cleanupStaleSessions(now)

  const [activeSessions, todayVisitors] = await Promise.all([
    prisma.visitorSession.findMany({
      where: { lastSeenAt: { gte: activeCutoff } },
      orderBy: { lastSeenAt: 'desc' },
      take: 50,
    }),
    prisma.visitorSession.count({
      where: { lastSeenAt: { gte: todayStart } },
    }),
  ])

  const pageCounts = new Map<string, number>()
  const locationCounts = new Map<
    string,
    {
      locationId: string
      locationLabel: string
      locationDisplayLabel: string
      locationFlag: string
      visitors: number
    }
  >()

  for (const session of activeSessions) {
    const path = session.path || '/'
    pageCounts.set(path, (pageCounts.get(path) ?? 0) + 1)

    const locationId = session.locationId?.trim() ?? ''
    const locationLabel = session.locationLabel?.trim() || 'Unknown location'
    const locationDisplayLabel =
      getVisitorLocationDisplayLabel({
        locationId,
        city: session.city,
        country: session.country,
      }) || locationLabel
    const locationFlag = getVisitorLocationFlag({
      locationId,
      country: session.country,
    })
    const key = locationGroupKey(session)
    const existing = locationCounts.get(key)

    if (existing) {
      existing.visitors += 1
    } else {
      locationCounts.set(key, {
        locationId,
        locationLabel,
        locationDisplayLabel,
        locationFlag,
        visitors: 1,
      })
    }
  }

  const activePages = [...pageCounts.entries()]
    .map(([path, visitors]) => ({
      path,
      pathLabel: formatVisitorPath(path),
      visitors,
    }))
    .sort((a, b) => b.visitors - a.visitors)

  const activeLocations = [...locationCounts.entries()]
    .map(([key, location]) => ({
      key,
      locationId: location.locationId,
      locationLabel: location.locationLabel,
      locationDisplayLabel: location.locationDisplayLabel,
      locationFlag: location.locationFlag,
      visitors: location.visitors,
    }))
    .sort((a, b) => b.visitors - a.visitors)

  return {
    liveCount: activeSessions.length,
    todayVisitors,
    activePages,
    activeLocations,
    sessions: activeSessions.map((session) => {
      const locationId = session.locationId?.trim() ?? ''
      const locationLabel = session.locationLabel?.trim() || 'Unknown location'
      const locationDisplayLabel =
        getVisitorLocationDisplayLabel({
          locationId,
          city: session.city,
          country: session.country,
        }) || locationLabel

      return {
        visitorId: session.visitorId,
        path: session.path,
        pathLabel: formatVisitorPath(session.path),
        referrer: session.referrer,
        referrerLabel: formatReferrerLabel(session.referrer),
        locationId,
        locationLabel,
        locationDisplayLabel,
        locationFlag: getVisitorLocationFlag({
          locationId,
          country: session.country,
        }),
        lastSeenAt: session.lastSeenAt.toISOString(),
        lastSeenLabel: formatLastSeenLabel(session.lastSeenAt, now),
      }
    }),
    activeWindowSeconds: LIVE_VISITOR_WINDOW_MS / 1000,
    refreshedAt: now.toISOString(),
  }
}
