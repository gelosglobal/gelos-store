import type { LiveVisitorsPayload } from '@/lib/admin/live-visitors-types'
import {
  cleanupOldFunnelEvents,
  getTodayFunnelShare,
  getTodayFunnelTrend,
} from '@/lib/db/visitor-funnel'
import { isDatabaseConfigured } from '@/lib/env'
import { prisma } from '@/lib/prisma'
import {
  classifyTrafficAttribution,
  TRAFFIC_CHANNEL_LABELS,
  TRAFFIC_TYPE_LABELS,
  type TrafficChannel,
  type TrafficType,
} from '@/lib/traffic-attribution'
import {
  getVisitorLocationDisplayLabel,
  getVisitorLocationFlag,
  resolveVisitorLocation,
} from '@/lib/visitor-location'

export const LIVE_VISITOR_WINDOW_MS = 2 * 60 * 1000
const STALE_CLEANUP_MS = 30 * 60 * 1000
const HOURLY_RETENTION_MS = 14 * 24 * 60 * 60 * 1000

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function startOfHour(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    0,
    0,
    0,
  )
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

function emptyCharts(): Pick<
  LiveVisitorsPayload,
  'trafficTrend' | 'pageShare' | 'funnelShare' | 'funnelTrend' | 'locationShare'
> {
  return {
    trafficTrend: [],
    pageShare: [],
    funnelShare: [],
    funnelTrend: [],
    locationShare: [],
  }
}

export async function countSessionsInRange(start: Date, end: Date): Promise<number> {
  if (!isDatabaseConfigured()) return 0

  // Prefer durable hourly presence so history survives live-session cleanup.
  const rows = await prisma.visitorHourlyPresence.findMany({
    where: {
      hourStart: {
        gte: start,
        lt: end,
      },
    },
    select: { visitorId: true },
  })

  return new Set(rows.map((row) => row.visitorId)).size
}

export type SessionTrafficBreakdown = {
  avgSessionDurationSeconds: number
  trafficTypes: {
    type: TrafficType
    label: string
    sessions: number
    share: number
  }[]
  channels: {
    channel: TrafficChannel
    label: string
    sessions: number
    share: number
  }[]
}

export async function getSessionTrafficBreakdown(
  start: Date,
  end: Date,
): Promise<SessionTrafficBreakdown> {
  const empty: SessionTrafficBreakdown = {
    avgSessionDurationSeconds: 0,
    trafficTypes: (['paid', 'organic', 'direct', 'unknown'] as TrafficType[]).map(
      (type) => ({
        type,
        label: TRAFFIC_TYPE_LABELS[type],
        sessions: 0,
        share: 0,
      }),
    ),
    channels: [],
  }

  if (!isDatabaseConfigured()) return empty

  const [hourlyRows, liveSessions] = await Promise.all([
    prisma.visitorHourlyPresence.findMany({
      where: {
        hourStart: { gte: start, lt: end },
      },
      select: {
        visitorId: true,
        trafficType: true,
        channel: true,
        firstSeenAt: true,
        lastSeenAt: true,
        landingReferrer: true,
        utmSource: true,
        utmMedium: true,
        utmCampaign: true,
        path: true,
      },
    }),
    prisma.visitorSession.findMany({
      where: {
        lastSeenAt: { gte: start, lt: end },
      },
      select: {
        visitorId: true,
        firstSeenAt: true,
        lastSeenAt: true,
        trafficType: true,
        channel: true,
      },
    }),
  ])

  // One row per visitor: prefer latest hourly attribution.
  const byVisitor = new Map<
    string,
    {
      trafficType: TrafficType
      channel: TrafficChannel
      durationSeconds: number
    }
  >()

  for (const row of hourlyRows) {
    let trafficType = (row.trafficType || 'unknown') as TrafficType
    let channel = (row.channel || 'unknown') as TrafficChannel

    if (trafficType === 'unknown' && !row.utmSource && !row.landingReferrer) {
      const classified = classifyTrafficAttribution({
        path: row.path,
        landingReferrer: row.landingReferrer ?? '',
        utmSource: row.utmSource ?? '',
        utmMedium: row.utmMedium ?? '',
        utmCampaign: row.utmCampaign ?? '',
      })
      trafficType = classified.trafficType
      channel = classified.channel
    }

    const firstSeen = row.firstSeenAt
    const lastSeen = row.lastSeenAt
    const durationSeconds =
      firstSeen && lastSeen
        ? Math.max(
            0,
            Math.round((lastSeen.getTime() - firstSeen.getTime()) / 1000),
          )
        : 0

    const existing = byVisitor.get(row.visitorId)
    if (!existing) {
      byVisitor.set(row.visitorId, { trafficType, channel, durationSeconds })
    } else {
      existing.durationSeconds = Math.max(
        existing.durationSeconds,
        durationSeconds,
      )
      if (existing.trafficType === 'unknown' && trafficType !== 'unknown') {
        existing.trafficType = trafficType
        existing.channel = channel
      }
    }
  }

  // Enrich duration from live sessions when available.
  for (const session of liveSessions) {
    const durationSeconds = Math.max(
      0,
      Math.round(
        (session.lastSeenAt.getTime() - session.firstSeenAt.getTime()) / 1000,
      ),
    )
    const existing = byVisitor.get(session.visitorId)
    if (existing) {
      existing.durationSeconds = Math.max(
        existing.durationSeconds,
        durationSeconds,
      )
    } else {
      byVisitor.set(session.visitorId, {
        trafficType: (session.trafficType || 'unknown') as TrafficType,
        channel: (session.channel || 'unknown') as TrafficChannel,
        durationSeconds,
      })
    }
  }

  const visitors = [...byVisitor.values()]
  const total = visitors.length || 1

  const typeCounts: Record<TrafficType, number> = {
    paid: 0,
    organic: 0,
    direct: 0,
    unknown: 0,
  }
  const channelCounts = new Map<TrafficChannel, number>()
  let durationSum = 0
  let durationCount = 0

  for (const visitor of visitors) {
    typeCounts[visitor.trafficType] =
      (typeCounts[visitor.trafficType] ?? 0) + 1
    channelCounts.set(
      visitor.channel,
      (channelCounts.get(visitor.channel) ?? 0) + 1,
    )
    if (visitor.durationSeconds > 0) {
      durationSum += visitor.durationSeconds
      durationCount += 1
    }
  }

  const trafficTypes = (
    ['paid', 'organic', 'direct', 'unknown'] as TrafficType[]
  ).map((type) => ({
    type,
    label: TRAFFIC_TYPE_LABELS[type],
    sessions: typeCounts[type],
    share: Math.round((typeCounts[type] / total) * 1000) / 10,
  }))

  const channels = [...channelCounts.entries()]
    .map(([channel, sessions]) => ({
      channel,
      label: TRAFFIC_CHANNEL_LABELS[channel] ?? channel,
      sessions,
      share: Math.round((sessions / total) * 1000) / 10,
    }))
    .sort((a, b) => b.sessions - a.sessions)

  return {
    avgSessionDurationSeconds:
      durationCount > 0 ? Math.round(durationSum / durationCount) : 0,
    trafficTypes,
    channels,
  }
}

async function recordHourlyPresence(input: {
  visitorId: string
  path: string
  landingPath: string
  landingReferrer: string
  utmSource: string
  utmMedium: string
  utmCampaign: string
  trafficType: string
  channel: string
  locationId: string
  city: string
  country: string
  locationLabel: string
  now: Date
}) {
  const hourStart = startOfHour(input.now)

  await prisma.visitorHourlyPresence.upsert({
    where: {
      hourStart_visitorId: {
        hourStart,
        visitorId: input.visitorId,
      },
    },
    create: {
      hourStart,
      visitorId: input.visitorId,
      path: input.path,
      landingPath: input.landingPath,
      landingReferrer: input.landingReferrer,
      utmSource: input.utmSource,
      utmMedium: input.utmMedium,
      utmCampaign: input.utmCampaign,
      trafficType: input.trafficType,
      channel: input.channel,
      locationId: input.locationId,
      city: input.city,
      country: input.country,
      locationLabel: input.locationLabel,
      firstSeenAt: input.now,
      lastSeenAt: input.now,
    },
    update: {
      path: input.path,
      locationId: input.locationId,
      city: input.city,
      country: input.country,
      locationLabel: input.locationLabel,
      lastSeenAt: input.now,
      // Keep first-touch attribution if already set.
      ...(input.trafficType !== 'unknown'
        ? {
            trafficType: input.trafficType,
            channel: input.channel,
          }
        : {}),
    },
  })
}

export async function upsertVisitorHeartbeat(input: {
  visitorId: string
  path: string
  referrer?: string
  landingPath?: string
  landingReferrer?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
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
  const attribution = classifyTrafficAttribution({
    path: input.landingPath || path,
    referrer,
    landingReferrer: input.landingReferrer || referrer,
    utmSource: input.utmSource,
    utmMedium: input.utmMedium,
    utmCampaign: input.utmCampaign,
  })
  const location = resolveVisitorLocation({
    locationId: input.locationId,
    geoCity: input.geoCity,
    geoCountry: input.geoCountry,
  })
  const now = new Date()

  const existing = await prisma.visitorSession.findUnique({
    where: { visitorId },
    select: {
      referrer: true,
      landingPath: true,
      landingReferrer: true,
      utmSource: true,
      utmMedium: true,
      utmCampaign: true,
      trafficType: true,
      channel: true,
    },
  })

  const hasFirstTouch = Boolean(
    existing?.landingPath ||
      existing?.landingReferrer ||
      existing?.utmSource ||
      (existing?.trafficType && existing.trafficType !== 'unknown'),
  )

  const firstTouch = hasFirstTouch
    ? {
        landingPath: existing!.landingPath || attribution.landingPath,
        landingReferrer:
          existing!.landingReferrer || attribution.landingReferrer,
        utmSource: existing!.utmSource || attribution.utmSource,
        utmMedium: existing!.utmMedium || attribution.utmMedium,
        utmCampaign: existing!.utmCampaign || attribution.utmCampaign,
        trafficType:
          existing!.trafficType && existing!.trafficType !== 'unknown'
            ? existing!.trafficType
            : attribution.trafficType,
        channel:
          existing!.channel && existing!.channel !== 'unknown'
            ? existing!.channel
            : attribution.channel,
      }
    : attribution

  await prisma.visitorSession.upsert({
    where: { visitorId },
    create: {
      visitorId,
      path,
      referrer: firstTouch.landingReferrer || referrer,
      landingPath: firstTouch.landingPath,
      landingReferrer: firstTouch.landingReferrer,
      utmSource: firstTouch.utmSource,
      utmMedium: firstTouch.utmMedium,
      utmCampaign: firstTouch.utmCampaign,
      trafficType: firstTouch.trafficType,
      channel: firstTouch.channel,
      locationId: location.locationId ?? '',
      city: location.city,
      country: location.country,
      locationLabel: location.label,
      firstSeenAt: now,
      lastSeenAt: now,
    },
    update: {
      path,
      // Keep original referrer when later heartbeats send empty/same-site.
      ...(referrer && !(existing?.referrer?.trim())
        ? { referrer }
        : {}),
      locationId: location.locationId ?? '',
      city: location.city,
      country: location.country,
      locationLabel: location.label,
      lastSeenAt: now,
      ...(!hasFirstTouch
        ? {
            landingPath: firstTouch.landingPath,
            landingReferrer: firstTouch.landingReferrer,
            utmSource: firstTouch.utmSource,
            utmMedium: firstTouch.utmMedium,
            utmCampaign: firstTouch.utmCampaign,
            trafficType: firstTouch.trafficType,
            channel: firstTouch.channel,
          }
        : {}),
    },
  })

  try {
    await recordHourlyPresence({
      visitorId,
      path,
      landingPath: firstTouch.landingPath,
      landingReferrer: firstTouch.landingReferrer,
      utmSource: firstTouch.utmSource,
      utmMedium: firstTouch.utmMedium,
      utmCampaign: firstTouch.utmCampaign,
      trafficType: firstTouch.trafficType,
      channel: firstTouch.channel,
      locationId: location.locationId ?? '',
      city: location.city,
      country: location.country,
      locationLabel: location.label,
      now,
    })
  } catch (error) {
    console.error('[visitor-sessions] hourly presence failed', error)
  }

  return { ok: true as const }
}

async function cleanupStaleSessions(now = new Date()) {
  if (!isDatabaseConfigured()) return

  const sessionCutoff = new Date(now.getTime() - STALE_CLEANUP_MS)
  const hourlyCutoff = new Date(now.getTime() - HOURLY_RETENTION_MS)

  await Promise.all([
    prisma.visitorSession.deleteMany({
      where: { lastSeenAt: { lt: sessionCutoff } },
    }),
    prisma.visitorHourlyPresence.deleteMany({
      where: { hourStart: { lt: hourlyCutoff } },
    }),
    cleanupOldFunnelEvents(now),
  ])
}

async function buildStoredCharts(
  now: Date,
): Promise<
  Pick<
    LiveVisitorsPayload,
    'trafficTrend' | 'pageShare' | 'funnelShare' | 'funnelTrend' | 'locationShare'
  >
> {
  const rangeStart = new Date(now.getTime() - 23 * 60 * 60 * 1000)
  const fromHour = startOfHour(rangeStart)
  const todayStart = startOfDay(now)

  const [hourlyRows, todayRows, funnelShare, funnelTrend] = await Promise.all([
    prisma.visitorHourlyPresence.findMany({
      where: { hourStart: { gte: fromHour } },
      select: { hourStart: true, visitorId: true },
    }),
    prisma.visitorHourlyPresence.findMany({
      where: { hourStart: { gte: todayStart } },
      select: {
        path: true,
        locationId: true,
        city: true,
        country: true,
        locationLabel: true,
        visitorId: true,
      },
    }),
    getTodayFunnelShare(now),
    getTodayFunnelTrend(now),
  ])

  const visitorsByHour = new Map<number, Set<string>>()
  for (const row of hourlyRows) {
    const key = row.hourStart.getTime()
    const set = visitorsByHour.get(key) ?? new Set<string>()
    set.add(row.visitorId)
    visitorsByHour.set(key, set)
  }

  const trafficTrend: LiveVisitorsPayload['trafficTrend'] = []
  for (let i = 23; i >= 0; i -= 1) {
    const hour = startOfHour(new Date(now.getTime() - i * 60 * 60 * 1000))
    trafficTrend.push({
      hour: hour.toISOString(),
      hourLabel: hour.toLocaleTimeString('en-US', {
        hour: 'numeric',
      }),
      visitors: visitorsByHour.get(hour.getTime())?.size ?? 0,
    })
  }

  const locationCounts = new Map<
    string,
    { label: string; flag: string; visitors: number }
  >()

  for (const row of todayRows) {
    const locationId = row.locationId?.trim() ?? ''
    const locationLabel = row.locationLabel?.trim() || 'Unknown location'
    const label =
      getVisitorLocationDisplayLabel({
        locationId,
        city: row.city,
        country: row.country,
      }) || locationLabel
    const flag = getVisitorLocationFlag({
      locationId,
      country: row.country,
    })
    const key = locationGroupKey(row)
    const existing = locationCounts.get(key)
    if (existing) existing.visitors += 1
    else locationCounts.set(key, { label, flag, visitors: 1 })
  }

  const locationTotal =
    [...locationCounts.values()].reduce((sum, row) => sum + row.visitors, 0) || 1

  // Keep pageShare shape for older clients; chart now uses funnelShare.
  const pageShare = funnelShare.map((row) => ({
    path: row.key,
    pathLabel: row.label,
    visitors: row.count,
    share: row.share,
  }))

  const locationShare = [...locationCounts.entries()]
    .map(([key, row]) => ({
      key,
      label: row.label,
      flag: row.flag,
      visitors: row.visitors,
      share: Math.round((row.visitors / locationTotal) * 100),
    }))
    .sort((a, b) => b.visitors - a.visitors)
    .slice(0, 6)

  return { trafficTrend, pageShare, funnelShare, funnelTrend, locationShare }
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
      ...emptyCharts(),
    }
  }

  await cleanupStaleSessions(now)

  const [activeSessions, todayVisitors, charts] = await Promise.all([
    prisma.visitorSession.findMany({
      where: { lastSeenAt: { gte: activeCutoff } },
      orderBy: { lastSeenAt: 'desc' },
      take: 50,
    }),
    prisma.visitorHourlyPresence
      .findMany({
        where: { hourStart: { gte: todayStart } },
        select: { visitorId: true },
      })
      .then((rows) => new Set(rows.map((row) => row.visitorId)).size),
    buildStoredCharts(now).catch((error) => {
      console.error('[visitor-sessions] charts failed', error)
      return emptyCharts()
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
    ...charts,
  }
}
