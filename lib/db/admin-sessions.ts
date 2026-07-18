import type {
  SessionsAnalyticsPayload,
  SessionsRange,
  SessionsSeriesPoint,
  SessionsTableRow,
} from '@/lib/admin/sessions-types'
import { isDatabaseConfigured } from '@/lib/env'
import { prisma } from '@/lib/prisma'
import { getSessionTrafficBreakdown } from '@/lib/db/visitor-sessions'

function parseDay(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function parseTime(value: string | undefined, fallback: string): {
  hours: number
  minutes: number
} {
  const raw = (value?.trim() || fallback).slice(0, 5)
  const match = /^(\d{1,2}):(\d{2})$/.exec(raw)
  if (!match) {
    const fb = /^(\d{1,2}):(\d{2})$/.exec(fallback)!
    return { hours: Number(fb[1]), minutes: Number(fb[2]) }
  }
  return {
    hours: Math.min(23, Math.max(0, Number(match[1]))),
    minutes: Math.min(59, Math.max(0, Number(match[2]))),
  }
}

function formatTime(hours: number, minutes: number): string {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function combineDateAndTime(day: Date, time: string, fallback: string): Date {
  const { hours, minutes } = parseTime(time, fallback)
  return new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    hours,
    minutes,
    0,
    0,
  )
}

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

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000)
}

function dateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function hourKey(date: Date): string {
  const hour = String(date.getHours()).padStart(2, '0')
  return `${dateKey(date)}T${hour}:00`
}

function formatDayLabel(date: Date): string {
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
  })
}

function formatHourLabel(date: Date): string {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
  })
}

function formatRangeLabel(
  start: Date,
  endExclusive: Date,
  startTime: string,
  endTime: string,
): string {
  const endInclusive = new Date(endExclusive.getTime() - 1)
  const sameDay =
    start.getFullYear() === endInclusive.getFullYear() &&
    start.getMonth() === endInclusive.getMonth() &&
    start.getDate() === endInclusive.getDate()

  const startDay = start.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
  })
  const endDay = endInclusive.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  if (sameDay) {
    return `${startDay}, ${startTime}–${endTime}`
  }

  return `${startDay} ${startTime} – ${endDay} ${endTime}`
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
      startTime: '00:00',
      endTime: '23:59',
    },
    comparisonRange: {
      startDate: toInputDate(previousStart),
      endDate: toInputDate(addDays(previousEnd, -1)),
      startTime: '00:00',
      endTime: '23:59',
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
  granularity: 'hour' | 'day'
} {
  const defaults = defaultSessionsRange()
  const startDay =
    parseDay(range?.startDate ?? defaults.range.startDate) ??
    parseDay(defaults.range.startDate)!
  const endDay =
    parseDay(range?.endDate ?? defaults.range.endDate) ??
    parseDay(defaults.range.endDate)!

  const startTime = parseTime(range?.startTime, '00:00')
  const endTime = parseTime(range?.endTime, '23:59')
  const startTimeLabel = formatTime(startTime.hours, startTime.minutes)
  const endTimeLabel = formatTime(endTime.hours, endTime.minutes)

  let start = combineDateAndTime(startDay, startTimeLabel, '00:00')
  let endExclusive = combineDateAndTime(endDay, endTimeLabel, '23:59')
  // Make end exclusive by adding 1 minute so 23:59 includes that minute's hour bucket.
  endExclusive = new Date(endExclusive.getTime() + 60_000)

  if (endExclusive <= start) {
    endExclusive = addDays(startOfDay(startDay), 1)
  }

  const durationMs = endExclusive.getTime() - start.getTime()
  const previousEndExclusive = start
  const previousStart = new Date(previousEndExclusive.getTime() - durationMs)

  const granularity: 'hour' | 'day' =
    durationMs <= 48 * 60 * 60 * 1000 ? 'hour' : 'day'

  return {
    start,
    endExclusive,
    previousStart,
    previousEndExclusive,
    granularity,
    range: {
      startDate: toInputDate(startDay),
      endDate: toInputDate(endDay),
      startTime: startTimeLabel,
      endTime: endTimeLabel,
    },
    comparisonRange: {
      startDate: toInputDate(previousStart),
      endDate: toInputDate(new Date(previousEndExclusive.getTime() - 1)),
      startTime: startTimeLabel,
      endTime: endTimeLabel,
    },
  }
}

type PresenceRow = {
  hourStart: Date
  visitorId: string
}

function aggregateByKey(
  rows: PresenceRow[],
  keyFn: (date: Date) => string,
): Map<string, { sessions: number; visitors: Set<string> }> {
  const byKey = new Map<string, { sessions: number; visitors: Set<string> }>()

  for (const row of rows) {
    const key = keyFn(row.hourStart)
    const existing = byKey.get(key) ?? {
      sessions: 0,
      visitors: new Set<string>(),
    }
    existing.sessions += 1
    existing.visitors.add(row.visitorId)
    byKey.set(key, existing)
  }

  return byKey
}

function buildDaySeries(
  start: Date,
  endExclusive: Date,
  currentByDay: Map<string, { sessions: number; visitors: Set<string> }>,
  previousByDay: Map<string, { sessions: number; visitors: Set<string> }>,
  previousStart: Date,
): SessionsSeriesPoint[] {
  const points: SessionsSeriesPoint[] = []
  const dayStart = startOfDay(start)
  const dayCount = daysBetween(dayStart, endExclusive)

  for (let i = 0; i < dayCount; i += 1) {
    const day = addDays(dayStart, i)
    const key = dateKey(day)
    const previousDay = addDays(startOfDay(previousStart), i)
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

function buildHourSeries(
  start: Date,
  endExclusive: Date,
  currentByHour: Map<string, { sessions: number; visitors: Set<string> }>,
  previousByHour: Map<string, { sessions: number; visitors: Set<string> }>,
  previousStart: Date,
): SessionsSeriesPoint[] {
  const points: SessionsSeriesPoint[] = []
  const firstHour = startOfHour(start)
  const hourCount = Math.max(
    1,
    Math.ceil((endExclusive.getTime() - firstHour.getTime()) / (60 * 60 * 1000)),
  )

  for (let i = 0; i < hourCount; i += 1) {
    const hour = addHours(firstHour, i)
    if (hour >= endExclusive) break
    const key = hourKey(hour)
    const previousHour = addHours(startOfHour(previousStart), i)
    const previousKey = hourKey(previousHour)
    const current = currentByHour.get(key)
    const previous = previousByHour.get(previousKey)

    points.push({
      date: key,
      label: formatHourLabel(hour),
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
  const rangeLabel = formatRangeLabel(
    resolved.start,
    resolved.endExclusive,
    resolved.range.startTime ?? '00:00',
    resolved.range.endTime ?? '23:59',
  )

  if (!isDatabaseConfigured()) {
    return {
      range: resolved.range,
      comparisonRange: resolved.comparisonRange,
      refreshedAt: now.toISOString(),
      granularity: resolved.granularity,
      snapshot: {
        sessions: 0,
        visitors: 0,
        sessionsChange: 0,
        visitorsChange: 0,
        avgSessionDurationSeconds: 0,
      },
      trafficTypes: [],
      trafficChannels: [],
      series: [],
      rows: [
        {
          key: 'period',
          label: rangeLabel,
          visitors: 0,
          sessions: 0,
        },
      ],
    }
  }

  const [currentRows, previousRows, traffic] = await Promise.all([
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
    getSessionTrafficBreakdown(resolved.start, resolved.endExclusive),
  ])

  const series =
    resolved.granularity === 'hour'
      ? buildHourSeries(
          resolved.start,
          resolved.endExclusive,
          aggregateByKey(currentRows, hourKey),
          aggregateByKey(previousRows, hourKey),
          resolved.previousStart,
        )
      : buildDaySeries(
          resolved.start,
          resolved.endExclusive,
          aggregateByKey(currentRows, dateKey),
          aggregateByKey(previousRows, dateKey),
          resolved.previousStart,
        )

  const currentVisitors = new Set(currentRows.map((row) => row.visitorId)).size
  const previousVisitors = new Set(previousRows.map((row) => row.visitorId)).size
  const currentSessions = currentRows.length
  const previousSessions = previousRows.length

  const detailRows: SessionsTableRow[] = series
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
      label: rangeLabel,
      visitors: currentVisitors,
      sessions: currentSessions,
    },
    ...detailRows,
  ]

  return {
    range: resolved.range,
    comparisonRange: resolved.comparisonRange,
    refreshedAt: now.toISOString(),
    granularity: resolved.granularity,
    snapshot: {
      sessions: currentSessions,
      visitors: currentVisitors,
      sessionsChange: percentChange(currentSessions, previousSessions),
      visitorsChange: percentChange(currentVisitors, previousVisitors),
      avgSessionDurationSeconds: traffic.avgSessionDurationSeconds,
    },
    trafficTypes: traffic.trafficTypes,
    trafficChannels: traffic.channels,
    series,
    rows,
  }
}
