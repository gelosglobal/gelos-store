'use client'

import Link from 'next/link'
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  ChartColumn,
  Clock3,
  Loader2,
  Search,
  Users,
} from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts'
import { toast } from 'sonner'
import type { SessionsAnalyticsPayload } from '@/lib/admin/sessions-types'
import { TrafficSourceIcon } from '@/components/admin/traffic-source-icon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatSessionDuration } from '@/lib/traffic-attribution'
import type { TrafficChannel, TrafficType } from '@/lib/traffic-attribution'
import { cn } from '@/lib/utils'

const sessionsChartConfig = {
  sessions: { label: 'Sessions', color: '#171717' },
  previousSessions: { label: 'Previous period', color: '#a3a3a3' },
} satisfies ChartConfig

function dateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function formatChange(value: number) {
  const rounded = Math.abs(Math.round(value * 10) / 10)
  return `${value >= 0 ? '↗' : '↘'} ${rounded}%`
}

function formatRangeLabel(
  startDate: string,
  endDate: string,
  startTime = '00:00',
  endTime = '23:59',
) {
  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T00:00:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return `${startDate} ${startTime}–${endDate} ${endTime}`
  }
  const startLabel = start.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
  })
  const endLabel = end.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  if (startDate === endDate) {
    return `${startLabel}, ${startTime}–${endTime}`
  }
  return `${startLabel} ${startTime} – ${endLabel} ${endTime}`
}

const emptyPayload: SessionsAnalyticsPayload = {
  range: { startDate: '', endDate: '', startTime: '00:00', endTime: '23:59' },
  comparisonRange: {
    startDate: '',
    endDate: '',
    startTime: '00:00',
    endTime: '23:59',
  },
  refreshedAt: '',
  granularity: 'day',
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
  rows: [],
}

function SessionsPageContent() {
  const searchParams = useSearchParams()
  const [payload, setPayload] = useState<SessionsAnalyticsPayload>(emptyPayload)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState(() => {
    const fromQuery = searchParams.get('startDate')
    if (fromQuery) return fromQuery
    const end = new Date()
    const start = new Date(end)
    start.setDate(start.getDate() - 59)
    return dateInputValue(start)
  })
  const [endDate, setEndDate] = useState(() => {
    return searchParams.get('endDate') || dateInputValue(new Date())
  })
  const [startTime, setStartTime] = useState(
    () => searchParams.get('startTime') || '00:00',
  )
  const [endTime, setEndTime] = useState(
    () => searchParams.get('endTime') || '23:59',
  )

  const loadSessions = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        startTime,
        endTime,
      })

      const res = await fetch(`/api/admin/sessions?${params.toString()}`, {
        cache: 'no-store',
      })
      const data = (await res.json()) as SessionsAnalyticsPayload & {
        error?: string
      }
      if (!res.ok) throw new Error(data.error ?? 'Failed to load sessions')

      setPayload({
        ...emptyPayload,
        ...data,
        snapshot: {
          ...emptyPayload.snapshot,
          ...data.snapshot,
        },
        trafficTypes: data.trafficTypes ?? [],
        trafficChannels: data.trafficChannels ?? [],
      })
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to load sessions',
      )
    } finally {
      setLoading(false)
    }
  }, [endDate, endTime, startDate, startTime])

  useEffect(() => {
    void loadSessions()
  }, [loadSessions])

  const refreshedLabel = payload.refreshedAt
    ? new Date(payload.refreshedAt).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })
    : '—'

  const rangeLabel = formatRangeLabel(
    payload.range.startDate || startDate,
    payload.range.endDate || endDate,
    payload.range.startTime || startTime,
    payload.range.endTime || endTime,
  )
  const comparisonLabel = formatRangeLabel(
    payload.comparisonRange.startDate,
    payload.comparisonRange.endDate,
    payload.comparisonRange.startTime || startTime,
    payload.comparisonRange.endTime || endTime,
  )

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return payload.rows
    return payload.rows.filter((row) => row.label.toLowerCase().includes(q))
  }, [payload.rows, search])

  const trafficTypes =
    payload.trafficTypes.length > 0
      ? payload.trafficTypes
      : (
          ['paid', 'organic', 'direct', 'unknown'] as TrafficType[]
        ).map((type) => ({
          type,
          label:
            type === 'paid'
              ? 'Paid'
              : type === 'organic'
                ? 'Organic'
                : type === 'direct'
                  ? 'Direct'
                  : 'Unknown',
          sessions: 0,
          share: 0,
        }))

  const maxTypeSessions = Math.max(
    1,
    ...trafficTypes.map((row) => row.sessions),
  )
  const maxChannelSessions = Math.max(
    1,
    ...payload.trafficChannels.map((row) => row.sessions),
  )

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-4 shadow-sm sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-500">
              <ChartColumn className="h-4 w-4" />
              <span>Analytics</span>
              <span className="text-neutral-300">/</span>
              <h1 className="text-base font-semibold text-neutral-950">
                Sessions
              </h1>
            </div>
            <p className="mt-1 text-sm text-neutral-500">
              Traffic sources, session time, and daily activity · refreshed{' '}
              {refreshedLabel}
            </p>
          </div>

          <Button asChild variant="outline" size="sm" className="h-9 gap-1.5">
            <Link href="/admin">
              <ArrowLeft className="h-3.5 w-3.5" />
              Dashboard
            </Link>
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <label className="inline-flex h-9 items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 text-sm text-neutral-700">
            <CalendarDays className="h-4 w-4 text-neutral-500" />
            <input
              type="date"
              value={startDate}
              max={endDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="bg-transparent outline-none"
              aria-label="Start date"
            />
            <span className="text-neutral-400">–</span>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="bg-transparent outline-none"
              aria-label="End date"
            />
          </label>

          <label className="inline-flex h-9 items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 text-sm text-neutral-700">
            <Clock3 className="h-4 w-4 text-neutral-500" />
            <input
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              className="bg-transparent outline-none"
              aria-label="Start time"
            />
            <span className="text-neutral-400">–</span>
            <input
              type="time"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
              className="bg-transparent outline-none"
              aria-label="End time"
            />
          </label>

          <Button
            type="button"
            size="sm"
            className="h-9 rounded-full bg-neutral-950 text-white hover:bg-neutral-800"
            onClick={() => void loadSessions()}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Apply range
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Sessions
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-3xl font-semibold tracking-tight text-neutral-950">
              {payload.snapshot.sessions.toLocaleString()}
            </p>
            <span
              className={cn(
                'text-sm font-medium',
                payload.snapshot.sessionsChange >= 0
                  ? 'text-emerald-600'
                  : 'text-red-600',
              )}
            >
              {formatChange(payload.snapshot.sessionsChange)}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Unique visitors
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Users className="h-4 w-4 text-neutral-400" />
            <p className="text-3xl font-semibold tracking-tight text-neutral-950">
              {payload.snapshot.visitors.toLocaleString()}
            </p>
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            {formatChange(payload.snapshot.visitorsChange)} vs prior period
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Avg. session time
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-neutral-400" />
            <p className="text-3xl font-semibold tracking-tight text-neutral-950">
              {formatSessionDuration(
                payload.snapshot.avgSessionDurationSeconds ?? 0,
              )}
            </p>
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            From first to last heartbeat
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-gradient-to-br from-neutral-950 to-neutral-800 p-4 text-white shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-white/60">
            Selected range
          </p>
          <p className="mt-2 text-lg font-semibold tracking-tight">
            {rangeLabel}
          </p>
          <p className="mt-1 text-xs text-white/55">
            Compared with {comparisonLabel}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-neutral-950">
                Traffic type
              </h2>
              <p className="text-xs text-neutral-500">
                Paid, organic, direct, and unknown sessions
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {trafficTypes.map((row) => (
              <div key={row.type} className="flex items-center gap-3">
                <TrafficSourceIcon trafficType={row.type} size={16} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-neutral-900">
                      {row.label}
                    </p>
                    <p className="text-sm tabular-nums text-neutral-700">
                      {row.sessions.toLocaleString()}
                      <span className="ml-1 text-xs text-neutral-500">
                        {row.share}%
                      </span>
                    </p>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className="h-full rounded-full bg-neutral-900 transition-all"
                      style={{
                        width: `${Math.max(
                          2,
                          (row.sessions / maxTypeSessions) * 100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
          <div>
            <h2 className="text-sm font-semibold text-neutral-950">
              Traffic source
            </h2>
            <p className="text-xs text-neutral-500">
              Facebook, Instagram, Google, and other providers
            </p>
          </div>

          <div className="mt-4 space-y-3">
            {payload.trafficChannels.length === 0 ? (
              <p className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-8 text-center text-sm text-neutral-500">
                No source data yet. New visits with UTMs or referrers will show
                here.
              </p>
            ) : (
              payload.trafficChannels.map((row) => (
                <div key={row.channel} className="flex items-center gap-3">
                  <TrafficSourceIcon
                    channel={row.channel as TrafficChannel}
                    size={16}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-neutral-900">
                        {row.label}
                      </p>
                      <p className="text-sm tabular-nums text-neutral-700">
                        {row.sessions.toLocaleString()}
                        <span className="ml-1 text-xs text-neutral-500">
                          {row.share}%
                        </span>
                      </p>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className="h-full rounded-full bg-neutral-900/80 transition-all"
                        style={{
                          width: `${Math.max(
                            2,
                            (row.sessions / maxChannelSessions) * 100,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-100 px-5 py-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-neutral-950">
                Sessions over time
              </h2>
              <p className="mt-0.5 text-xs text-neutral-500">
                {payload.granularity === 'hour'
                  ? 'Hourly view for short ranges (up to 48 hours)'
                  : 'Daily view · compared with the previous matching period'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-600">
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-neutral-950" />
                {rangeLabel}
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
                {comparisonLabel}
              </span>
            </div>
          </div>

          <div className="mt-6">
            {loading && payload.series.length === 0 ? (
              <div className="flex h-[280px] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
              </div>
            ) : (
              <ChartContainer
                config={sessionsChartConfig}
                className="h-[280px] w-full"
              >
                <LineChart
                  data={payload.series}
                  margin={{ left: 0, right: 12, top: 8, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e5e5e5"
                  />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={11}
                    minTickGap={28}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={11}
                    width={36}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="previousSessions"
                    stroke="var(--color-previousSessions)"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="sessions"
                    stroke="var(--color-sessions)"
                    strokeWidth={2.5}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            )}
          </div>
        </div>

        <div className="border-b border-neutral-100 px-5 py-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search days"
              className="h-9 rounded-full border-neutral-200 pl-9 text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>
                  {payload.granularity === 'hour' ? 'Hour' : 'Day'}
                </TableHead>
                <TableHead className="text-right">Visitors</TableHead>
                <TableHead className="text-right">Sessions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="py-12 text-center text-sm text-neutral-500"
                  >
                    {search
                      ? 'No session rows match your search.'
                      : 'No session data for this range yet. Traffic will appear as visitors browse the store.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((row, index) => (
                  <TableRow
                    key={row.key}
                    className={cn(index === 0 && 'bg-neutral-50/80 font-medium')}
                  >
                    <TableCell className="text-neutral-950">
                      <span className="inline-flex items-center gap-2">
                        {index === 0 ? (
                          <ArrowUpRight className="h-3.5 w-3.5 text-neutral-400" />
                        ) : null}
                        {row.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-neutral-700">
                      {row.visitors.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-neutral-950">
                      {row.sessions.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

export default function AdminSessionsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
        </div>
      }
    >
      <SessionsPageContent />
    </Suspense>
  )
}
