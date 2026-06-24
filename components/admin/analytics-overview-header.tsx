'use client'

import { useCallback, useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
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
import { cn } from '@/lib/utils'

const PERIOD_LABELS: Record<AnalyticsPeriod, string> = {
  today: 'Today',
  last7: 'Last 7 days',
  last30: 'Last 30 days',
}

type AnalyticsOverviewHeaderProps = {
  period: AnalyticsPeriod
  onPeriodChange: (period: AnalyticsPeriod) => void
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
    const interval = window.setInterval(loadLive, 10_000)
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
          <p className="text-xs text-neutral-500">All channels</p>
          <Select
            value={period}
            onValueChange={(value) => onPeriodChange(value as AnalyticsPeriod)}
          >
            <SelectTrigger className="mt-0.5 h-auto w-auto gap-1 border-0 bg-transparent p-0 text-lg font-semibold text-neutral-950 shadow-none hover:bg-transparent focus:ring-0 [&>svg]:hidden">
              <SelectValue />
              <ChevronDown className="h-4 w-4 text-neutral-500" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="last7">Last 7 days</SelectItem>
              <SelectItem value="last30">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <p className="sr-only">{PERIOD_LABELS[period]}</p>
        </div>

        <div className="grid flex-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="min-w-0">
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
                <span
                  className={cn(
                    'text-xs font-medium',
                    metric.change >= 0 ? 'text-neutral-500' : 'text-neutral-500',
                  )}
                >
                  {formatChange(metric.change)}
                </span>
              </div>
            </div>
          ))}
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
