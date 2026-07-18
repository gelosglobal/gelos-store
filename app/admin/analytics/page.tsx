'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import {
  ArrowUpRight,
  Lightbulb,
} from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts'
import { toast } from 'sonner'
import { AnalyticsMetricCard } from '@/components/admin/analytics-metric-card'
import { AnalyticsOverviewHeader } from '@/components/admin/analytics-overview-header'
import { LiveVisitorsPanel } from '@/components/admin/live-visitors-panel'
import type {
  AnalyticsCustomRange,
  AnalyticsPayload,
  AnalyticsPeriod,
} from '@/lib/admin/analytics-types'
import { Button } from '@/components/ui/button'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

const salesChartConfig = {
  sales: { label: 'Sales', color: 'hsl(221 83% 53%)' },
  previous: { label: 'Previous period', color: 'hsl(214 32% 75%)' },
} satisfies ChartConfig

const ordersChartConfig = {
  orders: { label: 'Orders', color: 'hsl(221 83% 53%)' },
  customers: { label: 'Customers', color: 'hsl(221 83% 53%)' },
} satisfies ChartConfig

function formatGhs(amount: number, compact = false) {
  if (compact && amount >= 1000) {
    return `GH₵${(amount / 1000).toFixed(1)}K`
  }
  return `GH₵${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatChange(value: number) {
  const positive = value >= 0
  return {
    label: `${positive ? '↗' : '↘'} ${Math.abs(value)}%`,
    positive,
  }
}

function channelGradient(channels: AnalyticsPayload['salesChannels']): string {
  if (channels.length === 0) {
    return 'conic-gradient(hsl(214 32% 85%) 0% 100%)'
  }

  const colors = [
    'hsl(221 83% 53%)',
    'hsl(280 60% 55%)',
    'hsl(142 50% 45%)',
    'hsl(38 92% 50%)',
    'hsl(199 89% 48%)',
  ]

  let cursor = 0
  const stops = channels.map((channel, index) => {
    const start = cursor
    cursor += channel.share
    return `${colors[index % colors.length]} ${start}% ${cursor}%`
  })

  return `conic-gradient(${stops.join(', ')})`
}

const emptyAnalytics: AnalyticsPayload = {
  snapshot: {
    totalSales: 0,
    orders: 0,
    customers: 0,
    sessions: 0,
    averageOrderValue: 0,
    avgSessionDurationSeconds: 0,
    salesChange: 0,
    customersChange: 0,
    ordersChange: 0,
    sessionsChange: 0,
    conversionRate: 0,
    conversionRateChange: 0,
  },
  series: [],
  salesChannels: [],
  trafficTypes: [],
  trafficChannels: [],
  topCategories: [],
  topProducts: [],
  paymentBreakdown: [],
  insight: {
    title: 'Loading analytics…',
    body: '',
    action: 'View orders',
  },
}

function dateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('today')
  const [customRange, setCustomRange] = useState<AnalyticsCustomRange>(() => {
    const end = new Date()
    const start = new Date(end)
    start.setDate(start.getDate() - 6)
    return {
      startDate: dateInputValue(start),
      endDate: dateInputValue(end),
    }
  })
  const [data, setData] = useState<AnalyticsPayload>(emptyAnalytics)
  const [loading, setLoading] = useState(true)
  const [showLiveActivity, setShowLiveActivity] = useState(false)

  const loadAnalytics = useCallback(async () => {
    try {
      const params = new URLSearchParams({ period })
      if (period === 'custom' && customRange.startDate && customRange.endDate) {
        params.set('startDate', customRange.startDate)
        params.set('endDate', customRange.endDate)
      }

      const res = await fetch(`/api/admin/analytics?${params.toString()}`, {
        cache: 'no-store',
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)

      setData({
        snapshot: {
          ...emptyAnalytics.snapshot,
          ...json.snapshot,
        },
        series: json.series ?? [],
        salesChannels: json.salesChannels ?? [],
        trafficTypes: json.trafficTypes ?? [],
        trafficChannels: json.trafficChannels ?? [],
        topCategories: json.topCategories ?? [],
        topProducts: json.topProducts ?? [],
        paymentBreakdown: json.paymentBreakdown ?? [],
        insight: json.insight ?? emptyAnalytics.insight,
      })
    } catch {
      toast.error('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [customRange.endDate, customRange.startDate, period])

  useEffect(() => {
    setLoading(true)
    loadAnalytics()
  }, [loadAnalytics])

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadAnalytics()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [loadAnalytics])

  const { snapshot, series, salesChannels, topCategories, topProducts, paymentBreakdown, insight } = data

  const periodLabel =
    period === 'today'
      ? 'Today'
      : period === 'last7'
        ? 'Last 7 days'
        : period === 'last30'
          ? 'Last 30 days'
          : 'Custom range'

  const topCategoryMax = topCategories[0]?.revenue ?? 1
  const insightHref =
    insight.action === 'View products' ? '/admin/products' : '/admin/orders'

  return (
    <div className="space-y-5">
      <AnalyticsOverviewHeader
        period={period}
        onPeriodChange={setPeriod}
        customStartDate={customRange.startDate}
        customEndDate={customRange.endDate}
        onCustomRangeChange={setCustomRange}
        snapshot={snapshot}
        series={series}
        loading={loading}
        liveVisitorsExpanded={showLiveActivity}
        onLiveVisitorsClick={() => setShowLiveActivity((open) => !open)}
      />

      {showLiveActivity ? <LiveVisitorsPanel compact /> : null}

      {/* Insight */}
      <div className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#D4FF59]/40">
            <Lightbulb className="h-5 w-5 text-neutral-800" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Insight
            </p>
            <p className="mt-0.5 font-semibold text-neutral-950">{insight.title}</p>
            <p className="mt-1 max-w-2xl text-sm text-neutral-600">{insight.body}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="shrink-0 gap-1" asChild>
          <Link href={insightHref}>
            {insight.action}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      {/* Primary metrics row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <AnalyticsMetricCard
          title="Total sales"
          value={formatGhs(snapshot.totalSales)}
          change={formatChange(snapshot.salesChange)}
          className="lg:col-span-2"
        >
          <ChartContainer config={salesChartConfig} className="h-[220px] w-full">
            <LineChart data={series} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
              <XAxis
                dataKey="hour"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={11}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={11}
                tickFormatter={(v) => (v >= 1000 ? `${v / 1000}K` : String(v))}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="previous"
                stroke="var(--color-previous)"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="var(--color-sales)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </AnalyticsMetricCard>

        <AnalyticsMetricCard title="Sales by channel" value={formatGhs(snapshot.totalSales, true)}>
          <div className="flex flex-col items-center gap-4 py-2">
            <div
              className="relative flex h-28 w-28 items-center justify-center rounded-full"
              style={{ background: channelGradient(salesChannels) }}
            >
              <div className="flex h-16 w-16 flex-col items-center justify-center rounded-full bg-white text-center">
                <span className="text-lg font-bold text-neutral-950">
                  {formatGhs(snapshot.totalSales, true)}
                </span>
              </div>
            </div>
            {salesChannels.length > 0 ? (
              <ul className="w-full space-y-2 text-sm">
                {salesChannels.map((ch) => (
                  <li key={ch.channel} className="flex justify-between gap-2">
                    <span className="text-neutral-600">{ch.channel}</span>
                    <span className="font-medium text-neutral-950">{ch.share}%</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-neutral-500">No channel data yet</p>
            )}
          </div>
        </AnalyticsMetricCard>
      </div>

      {/* Secondary metrics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AnalyticsMetricCard
          title="Customers"
          value={snapshot.customers.toLocaleString()}
          change={formatChange(snapshot.customersChange)}
        >
          <ChartContainer config={ordersChartConfig} className="h-[120px] w-full">
            <LineChart data={series} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="customers"
                stroke="var(--color-orders)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </AnalyticsMetricCard>

        <AnalyticsMetricCard title="Payment status" value={`${snapshot.orders} orders`}>
          {paymentBreakdown.length > 0 ? (
            <ul className="mt-2 space-y-2.5">
              {paymentBreakdown.map((step) => (
                <li key={step.status}>
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-neutral-700">{step.status}</span>
                    <span className="text-neutral-500">
                      {step.share}% · {step.count}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className="h-full rounded-full bg-sky-500"
                      style={{ width: `${Math.min(step.share, 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-neutral-500">No orders in this period</p>
          )}
        </AnalyticsMetricCard>

        <AnalyticsMetricCard title="Orders" value={String(snapshot.orders)}>
          <ChartContainer config={ordersChartConfig} className="h-[120px] w-full">
            <LineChart data={series} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="var(--color-orders)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </AnalyticsMetricCard>

        <AnalyticsMetricCard
          title="Average order value"
          value={formatGhs(snapshot.averageOrderValue)}
        >
          <ChartContainer config={salesChartConfig} className="h-[120px] w-full">
            <LineChart data={series} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="var(--color-sales)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </AnalyticsMetricCard>
      </div>

      {/* Bottom row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-neutral-950">
            Top categories · {periodLabel}
          </h2>
          <div className="mt-4 space-y-4">
            {topCategories.length > 0 ? (
              topCategories.map((row) => (
                <div key={row.category}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-neutral-800">{row.category}</span>
                    <span className="text-neutral-600">
                      {formatGhs(row.revenue)} · {row.orders} orders
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className="h-full rounded-full bg-neutral-900"
                      style={{
                        width: `${(row.revenue / topCategoryMax) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-neutral-500">No category sales in this period</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-neutral-950">Top products</h2>
          <ul className="mt-4 divide-y divide-neutral-100">
            {topProducts.length > 0 ? (
              topProducts.map((row) => (
                <li
                  key={row.product}
                  className="flex items-center justify-between py-3 text-sm first:pt-0"
                >
                  <span className="line-clamp-1 font-medium text-neutral-800">
                    {row.product}
                  </span>
                  <span className="shrink-0 pl-3 text-neutral-500">
                    {formatGhs(row.revenue)} · {row.units} units
                  </span>
                </li>
              ))
            ) : (
              <li className="py-6 text-sm text-neutral-500">No product sales in this period</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
