import type {
  SessionsAnalyticsPayload,
  SessionsRange,
  SessionsSeriesPoint,
  SessionsTableRow,
} from '@/lib/admin/sessions-types'
import { isDatabaseConfigured } from '@/lib/env'
import { prisma } from '@/lib/prisma'

function parseDay(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function dateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDayLabel(date: Date): string {
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
  })
}

function formatRangeLabel(start: Date, endExclusive: Date): string {
  const endInclusive = addDays(endExclusive, -1)
  const sameYear = start.getFullYear() === endInclusive.getFullYear()
  const startLabel = start.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  })
  const endLabel = endInclusive.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  return `${startLabel}–${endLabel}`
}

function toInputDate(date: Date): string {
  return dateKey(date)
}

function percentChange(current: number, previous: number): number {
  if (previous <= 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

function daysBetween(start: Date, endExclusive: Date): number {
  return Math.max(
    1,
    Math.round((endExclusive.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)),
  )
}

export function defaultSessionsRange(now = new Date()): {
  range: SessionsRange
  comparisonRange: SessionsRange
} {
  const endExclusive = addDays(startOfDay(now), 1)
  const start = addDays(endExclusive, -60)
  const dayCount = daysBetween(start, endExclusive)
  const previousEnd = start
  const previousStart = addDays(previousEnd, -dayCount)

  return {
    range: {
      startDate: toInputDate(start),
      endDate: toInputDate(addDays(endExclusive, -1)),
    },
    comparisonRange: {
      startDate: toInputDate(previousStart),
      endDate: toInputDate(addDays(previousEnd, -1)),
    },
  }
}

function resolveRanges(
  range?: Partial<SessionsRange>,
  comparisonRange?: Partial<SessionsRange>,
): {
  start: Date
  endExclusive: Date
  previousStart: Date
  previousEndExclusive: Date
  range: SessionsRange
  comparisonRange: SessionsRange
} {
  const defaults = defaultSessionsRange()
  const start =
    parseDay(range?.startDate ?? defaults.range.startDate) ??
    parseDay(defaults.range.startDate)!
  const endInclusive =
    parseDay(range?.endDate ?? defaults.range.endDate) ??
    parseDay(defaults.range.endDate)!
  const endExclusive = addDays(startOfDay(endInclusive), 1)
  const dayCount = daysBetween(startOfDay(start), endExclusive)

  const comparisonEndInclusive =
    parseDay(comparisonRange?.endDate ?? '') ??
    addDays(startOfDay(start), -1)
  const comparisonStart =
    parseDay(comparisonRange?.startDate ?? '') ??
    addDays(startOfDay(comparisonEndInclusive), -(dayCount - 1))
  const previousStart = startOfDay(comparisonStart)
  const previousEndExclusive = addDays(startOfDay(comparisonEndInclusive), 1)

  return {
    start: startOfDay(start),
    endExclusive,
    previousStart,
    previousEndExclusive,
    range: {
      startDate: toInputDate(startOfDay(start)),
      endDate: toInputDate(startOfDay(endInclusive)),
    },
    comparisonRange: {
      startDate: toInputDate(previousStart),
      endDate: toInputDate(startOfDay(comparisonEndInclusive)),
    },
  }
}

type PresenceRow = {
  hourStart: Date
  visitorId: string
}

function aggregateByDay(rows: PresenceRow[]): Map<
  string,
  { sessions: number; visitors: Set<string> }
> {
  const byDay = new Map<string, { sessions: number; visitors: Set<string> }>()

  for (const row of rows) {
    const key = dateKey(row.hourStart)
    const existing = byDay.get(key) ?? {
      sessions: 0,
      visitors: new Set<string>(),
    }
    existing.sessions += 1
    existing.visitors.add(row.visitorId)
    byDay.set(key, existing)
  }

  return byDay
}

function buildSeries(
  start: Date,
  endExclusive: Date,
  currentByDay: Map<string, { sessions: number; visitors: Set<string> }>,
  previousByDay: Map<string, { sessions: number; visitors: Set<string> }>,
  previousStart: Date,
): SessionsSeriesPoint[] {
  const points: SessionsSeriesPoint[] = []
  const dayCount = daysBetween(start, endExclusive)

  for (let i = 0; i < dayCount; i += 1) {
    const day = addDays(start, i)
    const key = dateKey(day)
    const previousDay = addDays(previousStart, i)
    const previousKey = dateKey(previousDay)
    const current = currentByDay.get(key)
    const previous = previousByDay.get(previousKey)

    points.push({
      date: key,
      label: formatDayLabel(day),
      sessions: current?.sessions ?? 0,
      visitors: current?.visitors.size ?? 0,
      previousSessions: previous?.sessions ?? 0,
    })
  }

  return points
}

export async function getSessionsAnalytics(input?: {
  range?: Partial<SessionsRange>
  comparisonRange?: Partial<SessionsRange>
}): Promise<SessionsAnalyticsPayload> {
  const now = new Date()
  const resolved = resolveRanges(input?.range, input?.comparisonRange)

  if (!isDatabaseConfigured()) {
    return {
      range: resolved.range,
      comparisonRange: resolved.comparisonRange,
      refreshedAt: now.toISOString(),
      snapshot: {
        sessions: 0,
        visitors: 0,
        sessionsChange: 0,
        visitorsChange: 0,
      },
      series: buildSeries(
        resolved.start,
        resolved.endExclusive,
        new Map(),
        new Map(),
        resolved.previousStart,
      ),
      rows: [
        {
          key: 'period',
          label: formatRangeLabel(resolved.start, resolved.endExclusive),
          visitors: 0,
          sessions: 0,
        },
      ],
    }
  }

  const [currentRows, previousRows] = await Promise.all([
    prisma.visitorHourlyPresence.findMany({
      where: {
        hourStart: {
          gte: resolved.start,
          lt: resolved.endExclusive,
        },
      },
      select: {
        hourStart: true,
        visitorId: true,
      },
    }),
    prisma.visitorHourlyPresence.findMany({
      where: {
        hourStart: {
          gte: resolved.previousStart,
          lt: resolved.previousEndExclusive,
        },
      },
      select: {
        hourStart: true,
        visitorId: true,
      },
    }),
  ])

  const currentByDay = aggregateByDay(currentRows)
  const previousByDay = aggregateByDay(previousRows)
  const series = buildSeries(
    resolved.start,
    resolved.endExclusive,
    currentByDay,
    previousByDay,
    resolved.previousStart,
  )

  const currentVisitors = new Set(currentRows.map((row) => row.visitorId)).size
  const previousVisitors = new Set(previousRows.map((row) => row.visitorId)).size
  const currentSessions = currentRows.length
  const previousSessions = previousRows.length

  const dailyRows: SessionsTableRow[] = series
    .filter((point) => point.sessions > 0 || point.visitors > 0)
    .map((point) => ({
      key: point.date,
      label: point.label,
      visitors: point.visitors,
      sessions: point.sessions,
    }))
    .reverse()

  const rows: SessionsTableRow[] = [
    {
      key: 'period',
      label: formatRangeLabel(resolved.start, resolved.endExclusive),
      visitors: currentVisitors,
      sessions: currentSessions,
    },
    ...dailyRows,
  ]

  return {
    range: resolved.range,
    comparisonRange: resolved.comparisonRange,
    refreshedAt: now.toISOString(),
    snapshot: {
      sessions: currentSessions,
      visitors: currentVisitors,
      sessionsChange: percentChange(currentSessions, previousSessions),
      visitorsChange: percentChange(currentVisitors, previousVisitors),
    },
    series,
    rows,
  }
}
