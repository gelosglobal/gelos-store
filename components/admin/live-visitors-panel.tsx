'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Area, AreaChart, Bar, BarChart, XAxis, YAxis } from 'recharts'
import { MapPin, RefreshCw, Users } from 'lucide-react'
import type { LiveVisitorsPayload } from '@/lib/admin/live-visitors-types'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { cn } from '@/lib/utils'

const emptyLive: LiveVisitorsPayload = {
  liveCount: 0,
  todayVisitors: 0,
  activePages: [],
  activeLocations: [],
  sessions: [],
  activeWindowSeconds: 120,
  refreshedAt: '',
  trafficTrend: [],
  pageShare: [],
  locationShare: [],
}

const trafficChartConfig = {
  visitors: { label: 'Visitors', color: '#10b981' },
} satisfies ChartConfig

const pageChartConfig = {
  visitors: { label: 'Visitors', color: '#171717' },
} satisfies ChartConfig

type LiveVisitorsPanelProps = {
  pollMs?: number
  compact?: boolean
}

export function LiveVisitorsPanel({
  pollMs = 10_000,
  compact = false,
}: LiveVisitorsPanelProps) {
  const [data, setData] = useState<LiveVisitorsPayload>(emptyLive)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/analytics/live-visitors', {
        cache: 'no-store',
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setData({
        ...emptyLive,
        ...json,
        trafficTrend: json.trafficTrend ?? [],
        pageShare: json.pageShare ?? [],
        locationShare: json.locationShare ?? [],
      })
    } catch {
      // Keep last good data on poll failures.
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    void load()
    const interval = window.setInterval(() => {
      void load()
    }, pollMs)
    return () => window.clearInterval(interval)
  }, [load, pollMs])

  const refreshedLabel = data.refreshedAt
    ? new Date(data.refreshedAt).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
      })
    : '—'

  const trendTotal = useMemo(
    () => data.trafficTrend.reduce((sum, point) => sum + point.visitors, 0),
    [data.trafficTrend],
  )

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      {!compact ? (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
              <MapPin className="h-5 w-5 text-emerald-700" />
              <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Live visitors
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <p className="text-3xl font-bold tracking-tight text-neutral-950">
                  {data.liveCount}
                </p>
                <p className="text-sm text-neutral-500">online now</p>
              </div>
            </div>
          </div>

          <p className="flex items-center gap-1.5 text-xs text-neutral-500">
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            Updated {refreshedLabel}
          </p>
        </div>
      ) : (
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-950">Live activity</h2>
          <p className="flex items-center gap-1.5 text-xs text-neutral-500">
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            Updated {refreshedLabel}
          </p>
        </div>
      )}

      <div className={cn('grid gap-4 sm:grid-cols-3', !compact && 'mt-6')}>
        <div className="rounded-xl border border-neutral-100 bg-neutral-50/80 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Online now
          </p>
          <p className="mt-1 text-2xl font-bold text-neutral-950">{data.liveCount}</p>
        </div>
        <div className="rounded-xl border border-neutral-100 bg-neutral-50/80 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Unique today
          </p>
          <p className="mt-1 text-2xl font-bold text-neutral-950">
            {data.todayVisitors}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-100 bg-neutral-50/80 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Last 24h visits
          </p>
          <p className="mt-1 text-2xl font-bold text-neutral-950">{trendTotal}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-neutral-100 p-4 lg:col-span-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-neutral-950">
              Traffic · last 24 hours
            </h3>
            <p className="text-xs text-neutral-500">Unique visitors per hour</p>
          </div>
          {data.trafficTrend.some((point) => point.visitors > 0) ? (
            <ChartContainer config={trafficChartConfig} className="h-[180px] w-full">
              <AreaChart data={data.trafficTrend} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <XAxis
                  dataKey="hourLabel"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  fontSize={10}
                  interval="preserveStartEnd"
                  minTickGap={24}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  width={28}
                  fontSize={10}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="visitors"
                  stroke="var(--color-visitors)"
                  fill="var(--color-visitors)"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <p className="py-10 text-center text-sm text-neutral-500">
              Traffic history will appear as visitors browse the store.
            </p>
          )}
        </div>

        <div className="rounded-xl border border-neutral-100 p-4">
          <h3 className="mb-3 text-sm font-semibold text-neutral-950">
            Pages today
          </h3>
          {data.pageShare.length > 0 ? (
            <ChartContainer config={pageChartConfig} className="h-[180px] w-full">
              <BarChart
                data={data.pageShare}
                layout="vertical"
                margin={{ left: 0, right: 8, top: 4, bottom: 0 }}
              >
                <XAxis type="number" hide allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="pathLabel"
                  width={88}
                  tickLine={false}
                  axisLine={false}
                  fontSize={10}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="visitors"
                  fill="var(--color-visitors)"
                  radius={[0, 6, 6, 0]}
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <p className="py-10 text-center text-sm text-neutral-500">
              No page analytics yet today.
            </p>
          )}
        </div>

        <div className="rounded-xl border border-neutral-100 p-4">
          <h3 className="mb-3 text-sm font-semibold text-neutral-950">
            Locations today
          </h3>
          {data.locationShare.length > 0 ? (
            <ul className="space-y-3">
              {data.locationShare.map((location) => (
                <li key={location.key}>
                  <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span aria-hidden>{location.flag}</span>
                      <span className="truncate font-medium text-neutral-800">
                        {location.label}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-neutral-600">
                      {location.share}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className="h-full rounded-full bg-sky-500"
                      style={{ width: `${Math.max(location.share, 4)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-10 text-center text-sm text-neutral-500">
              No location analytics yet today.
            </p>
          )}
        </div>

        <div className="rounded-xl border border-neutral-100 p-4">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-neutral-950">
            <Users className="h-4 w-4 text-neutral-500" />
            Live sessions
          </h3>
          {data.sessions.length > 0 ? (
            <ul className="divide-y divide-neutral-100">
              {data.sessions.slice(0, 5).map((session) => (
                <li
                  key={session.visitorId}
                  className="flex items-start justify-between gap-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="shrink-0 text-base leading-none" aria-hidden>
                        {session.locationFlag}
                      </span>
                      <p className="line-clamp-1 font-medium text-neutral-800">
                        {session.pathLabel}
                      </p>
                    </div>
                    <p className="mt-0.5 pl-6 text-xs text-neutral-500">
                      {session.locationDisplayLabel}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-neutral-500">
                    {session.lastSeenLabel}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-center text-sm text-neutral-500">
              No live sessions right now.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
