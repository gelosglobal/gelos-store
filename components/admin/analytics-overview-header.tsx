'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import type {
  AnalyticsPeriod,
  AnalyticsSeriesPoint,
  AnalyticsSnapshot,
} from '@/lib/admin/analytics-types'
import { MiniSparkline } from '@/components/admin/mini-sparkline'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatSessionDuration } from '@/lib/traffic-attribution'
import { cn } from '@/lib/utils'

const PERIOD_LABELS: Record<AnalyticsPeriod, string> = {
  today: 'Today',
  last7: 'Last 7 days',
  last30: 'Last 30 days',
  custom: 'Custom',
}

type AnalyticsOverviewHeaderProps = {
  period: AnalyticsPeriod
  onPeriodChange: (period: AnalyticsPeriod) => void
  customStartDate?: string
  customEndDate?: string
  onCustomRangeChange?: (range: { startDate: string; endDate: string }) => void
  snapshot: AnalyticsSnapshot
  series: AnalyticsSeriesPoint[]
  loading?: boolean
  liveVisitorsExpanded?: boolean
  onLiveVisitorsClick?: () => void
}

function formatGhs(amount: number, compact = false) {
  if (compact && amount >= 1000) {
    return `GH₵${(amount / 1000).toFixed(1)}K`
  }
  return `GH₵${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function formatChange(value: number) {
  const rounded = Math.abs(Math.round(value * 10) / 10)
  return `${value >= 0 ? '↗' : '↘'} ${rounded}%`
}

function dateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function sessionsHrefForPeriod(
  period: AnalyticsPeriod,
  customStartDate?: string,
  customEndDate?: string,
): string {
  const end = new Date()
  const start = new Date(end)

  if (period === 'today') {
    // keep start = today
  } else if (period === 'last7') {
    start.setDate(start.getDate() - 6)
  } else if (period === 'last30') {
    start.setDate(start.getDate() - 29)
  } else if (period === 'custom' && customStartDate && customEndDate) {
    return `/admin/sessions?startDate=${encodeURIComponent(customStartDate)}&endDate=${encodeURIComponent(customEndDate)}`
  } else {
    start.setDate(start.getDate() - 6)
  }

  return `/admin/sessions?startDate=${encodeURIComponent(dateInputValue(start))}&endDate=${encodeURIComponent(dateInputValue(end))}`
}

function WorldMapBackdrop() {
  return (
    <div
      className="pointer-events-none absolute inset-y-0 right-0 w-[min(42%,280px)] overflow-hidden opacity-[0.35]"
      aria-hidden
    >
      <svg
        viewBox="0 0 280 120"
        className="h-full w-full"
        preserveAspectRatio="xMaxYMid slice"
      >
        <defs>
          <pattern
            id="world-dots"
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1.2" cy="1.2" r="1.1" fill="#cbd5e1" />
          </pattern>
        </defs>
        <rect width="280" height="120" fill="url(#world-dots)" />
        <ellipse cx="210" cy="58" rx="72" ry="34" fill="white" opacity="0.55" />
        <ellipse cx="88" cy="52" rx="48" ry="30" fill="white" opacity="0.45" />
        <ellipse cx="145" cy="42" rx="36" ry="22" fill="white" opacity="0.4" />
      </svg>
    </div>
  )
}

export function AnalyticsOverviewHeader({
  period,
  onPeriodChange,
  customStartDate,
  customEndDate,
  onCustomRangeChange,
  snapshot,
  series,
  loading,
  liveVisitorsExpanded,
  onLiveVisitorsClick,
}: AnalyticsOverviewHeaderProps) {
  const [liveCount, setLiveCount] = useState(0)

  const loadLive = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/analytics/live-visitors', {
        cache: 'no-store',
      })
      const json = await res.json()
      if (res.ok) setLiveCount(json.liveCount ?? 0)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    loadLive()
    const interval = window.setInterval(loadLive, 30_000)
    return () => window.clearInterval(interval)
  }, [loadLive])

  const salesSpark = series.map((point) => point.sales)
  const ordersSpark = series.map((point) => point.orders)
  const sessionsSpark = series.map((point) => point.customers)

  const metrics = [
    {
      label: 'Sessions',
      value: snapshot.sessions.toLocaleString(),
      change: snapshot.sessionsChange,
      spark: sessionsSpark,
    },
    {
      label: 'Avg. session time',
      value: formatSessionDuration(snapshot.avgSessionDurationSeconds ?? 0),
      change: 0,
      spark: sessionsSpark,
      hideChange: true,
    },
    {
      label: 'Total sales',
      value: formatGhs(snapshot.totalSales, true),
      change: snapshot.salesChange,
      spark: salesSpark,
    },
    {
      label: 'Orders',
      value: snapshot.orders.toLocaleString(),
      change: snapshot.ordersChange,
      spark: ordersSpark,
    },
    {
      label: 'Conversion rate',
      value: `${snapshot.conversionRate.toFixed(2)}%`,
      change: snapshot.conversionRateChange,
      spark: ordersSpark,
    },
  ]

  return (
    <div className="relative overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <WorldMapBackdrop />

      <div className="relative flex flex-col gap-5 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="shrink-0">
          <p className="text-xs text-neutral-500">All traffic</p>
          <Select
            value={period}
            onValueChange={(value) => onPeriodChange(value as AnalyticsPeriod)}
          >
            <SelectTrigger className="mt-1 h-9 w-auto min-w-[9.5rem] gap-2 rounded-md border border-neutral-200 bg-white px-2.5 text-left text-base font-semibold text-neutral-950 shadow-none hover:bg-neutral-50 focus:ring-2 focus:ring-neutral-200 [&_svg]:text-neutral-500 [&_svg]:opacity-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="last7">Last 7 days</SelectItem>
              <SelectItem value="last30">Last 30 days</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
          {period === 'custom' && onCustomRangeChange ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={customStartDate ?? ''}
                max={customEndDate || undefined}
                onChange={(event) =>
                  onCustomRangeChange({
                    startDate: event.target.value,
                    endDate: customEndDate ?? '',
                  })
                }
                className="h-8 rounded-md border border-neutral-200 bg-white px-2 text-xs text-neutral-700 outline-none focus:border-neutral-400"
                aria-label="Custom start date"
              />
              <span className="text-xs text-neutral-500">to</span>
              <input
                type="date"
                value={customEndDate ?? ''}
                min={customStartDate || undefined}
                onChange={(event) =>
                  onCustomRangeChange({
                    startDate: customStartDate ?? '',
                    endDate: event.target.value,
                  })
                }
                className="h-8 rounded-md border border-neutral-200 bg-white px-2 text-xs text-neutral-700 outline-none focus:border-neutral-400"
                aria-label="Custom end date"
              />
            </div>
          ) : null}
          <p className="sr-only">{PERIOD_LABELS[period]}</p>
        </div>

        <div className="grid flex-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {metrics.map((metric) => {
            const content = (
              <>
                <p className="text-xs text-neutral-500">{metric.label}</p>
                <div className="mt-1 flex items-center gap-2">
                  <p
                    className={cn(
                      'text-base font-semibold tracking-tight text-neutral-950 sm:text-lg',
                      loading && 'opacity-60',
                    )}
                  >
                    {metric.value}
                  </p>
                  <MiniSparkline values={metric.spark} />
                  {!metric.hideChange ? (
                    <span className="text-xs font-medium text-neutral-500">
                      {formatChange(metric.change)}
                    </span>
                  ) : null}
                </div>
              </>
            )

            if (metric.label === 'Sessions' || metric.label === 'Avg. session time') {
              return (
                <Link
                  key={metric.label}
                  href={sessionsHrefForPeriod(
                    period,
                    customStartDate,
                    customEndDate,
                  )}
                  className="min-w-0 rounded-lg p-1 -m-1 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300"
                >
                  {content}
                </Link>
              )
            }

            return (
              <div key={metric.label} className="min-w-0">
                {content}
              </div>
            )
          })}
        </div>

        {onLiveVisitorsClick ? (
          <button
            type="button"
            onClick={onLiveVisitorsClick}
            aria-expanded={liveVisitorsExpanded}
            className={cn(
              'shrink-0 rounded-lg px-2 py-1 text-left transition-colors lg:pl-2 lg:text-right',
              'hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300',
              liveVisitorsExpanded && 'bg-emerald-50/80',
            )}
          >
            <p className="text-xs text-neutral-500">Live visitors</p>
            <div className="mt-1 flex items-center gap-2 lg:justify-end">
              <p className="text-2xl font-semibold tracking-tight text-neutral-950">
                {liveCount}
              </p>
              <span className="relative flex h-3.5 w-3.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-emerald-500 bg-white" />
              </span>
            </div>
          </button>
        ) : (
          <div className="shrink-0 lg:pl-2 lg:text-right">
            <p className="text-xs text-neutral-500">Live visitors</p>
            <div className="mt-1 flex items-center gap-2 lg:justify-end">
              <p className="text-2xl font-semibold tracking-tight text-neutral-950">
                {liveCount}
              </p>
              <span className="relative flex h-3.5 w-3.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-emerald-500 bg-white" />
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
