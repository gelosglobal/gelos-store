'use client'

import { useMemo, useState } from 'react'
import {
  ArrowUpRight,
  ChevronDown,
  Lightbulb,
  RefreshCw,
} from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts'
import { AnalyticsMetricCard } from '@/components/admin/analytics-metric-card'
import {
  conversionFunnel,
  featuredInsight,
  getAnalyticsSnapshot,
  getHourlySeries,
  salesChannels,
  topCategories,
  trafficSources,
  type AnalyticsPeriod,
} from '@/lib/admin/analytics-data'
import { Button } from '@/components/ui/button'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
const salesChartConfig = {
  sales: { label: 'Sales', color: 'hsl(221 83% 53%)' },
  previous: { label: 'Previous period', color: 'hsl(214 32% 75%)' },
} satisfies ChartConfig

const sessionsChartConfig = {
  sessions: { label: 'Sessions', color: 'hsl(221 83% 53%)' },
} satisfies ChartConfig

function formatGhs(amount: number, compact = false) {
  if (compact && amount >= 1000) {
    return `GH₵${(amount / 1000).toFixed(1)}K`
  }
  return `GH₵${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('today')

  const snapshot = useMemo(() => getAnalyticsSnapshot(period), [period])
  const hourly = useMemo(() => getHourlySeries(period), [period])

  const periodLabel =
    period === 'today'
      ? 'Today'
      : period === 'last7'
        ? 'Last 7 days'
        : 'Last 30 days'

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
            Analytics
          </h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-neutral-500">
            <RefreshCw className="h-3.5 w-3.5" />
            Last refreshed just now
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={period}
            onValueChange={(v) => setPeriod(v as AnalyticsPeriod)}
          >
            <SelectTrigger className="h-9 w-[130px] bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="last7">Last 7 days</SelectItem>
              <SelectItem value="last30">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-9 gap-1 bg-white">
            vs previous
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="sm" className="h-9 bg-white">
            GH₵ GHS
          </Button>
        </div>
      </div>

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
            <p className="mt-0.5 font-semibold text-neutral-950">
              {featuredInsight.title}
            </p>
            <p className="mt-1 max-w-2xl text-sm text-neutral-600">
              {featuredInsight.body}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="shrink-0 gap-1">
          {featuredInsight.action}
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Primary metrics row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <AnalyticsMetricCard
          title="Total sales"
          value={formatGhs(snapshot.totalSales)}
          change={{
            label: `↗ ${snapshot.salesChange}%`,
            positive: true,
          }}
          className="lg:col-span-2"
        >
          <ChartContainer config={salesChartConfig} className="h-[220px] w-full">
            <LineChart data={hourly} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
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
              style={{
                background: `conic-gradient(hsl(221 83% 53%) 0% 94%, hsl(280 60% 55%) 94% 98%, hsl(142 50% 45%) 98% 100%)`,
              }}
            >
              <div className="flex h-16 w-16 flex-col items-center justify-center rounded-full bg-white text-center">
                <span className="text-lg font-bold text-neutral-950">
                  {formatGhs(snapshot.totalSales, true)}
                </span>
              </div>
            </div>
            <ul className="w-full space-y-2 text-sm">
              {salesChannels.map((ch) => (
                <li key={ch.channel} className="flex justify-between gap-2">
                  <span className="text-neutral-600">{ch.channel}</span>
                  <span className="font-medium text-neutral-950">
                    {ch.share}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </AnalyticsMetricCard>
      </div>

      {/* Secondary metrics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AnalyticsMetricCard
          title="Sessions"
          value={snapshot.sessions.toLocaleString()}
          change={{
            label: `↗ ${snapshot.sessionsChange}%`,
            positive: true,
          }}
        >
          <ChartContainer config={sessionsChartConfig} className="h-[120px] w-full">
            <LineChart data={hourly} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="sessions"
                stroke="var(--color-sessions)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </AnalyticsMetricCard>

        <AnalyticsMetricCard
          title="Conversion rate"
          value={`${snapshot.conversionRate}%`}
        >
          <ul className="mt-2 space-y-2.5">
            {conversionFunnel.map((step) => (
              <li key={step.step}>
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-neutral-700">{step.step}</span>
                  <span className="text-neutral-500">
                    {step.rate}% · {step.count}
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className="h-full rounded-full bg-sky-500"
                    style={{ width: `${Math.min(step.rate, 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </AnalyticsMetricCard>

        <AnalyticsMetricCard title="Orders" value={String(snapshot.orders)}>
          <ChartContainer config={sessionsChartConfig} className="h-[120px] w-full">
            <LineChart data={hourly} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="var(--color-sessions)"
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
            <LineChart data={hourly} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
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
            {topCategories.map((row) => (
              <div key={row.category}>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-neutral-800">
                    {row.category}
                  </span>
                  <span className="text-neutral-600">
                    {formatGhs(row.revenue)} · {row.orders} orders
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className="h-full rounded-full bg-neutral-900"
                    style={{
                      width: `${(row.revenue / topCategories[0].revenue) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-neutral-950">
            Traffic sources
          </h2>
          <ul className="mt-4 divide-y divide-neutral-100">
            {trafficSources.map((row) => (
              <li
                key={row.source}
                className="flex items-center justify-between py-3 text-sm first:pt-0"
              >
                <span className="font-medium text-neutral-800">{row.source}</span>
                <span className="text-neutral-500">
                  {row.sessions} · {row.share}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
