'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowUpRight,
  CalendarDays,
  ChartColumn,
  ChevronRight,
  Loader2,
  Search,
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
import { cn } from '@/lib/utils'

const sessionsChartConfig = {
  sessions: { label: 'Sessions', color: '#2563eb' },
  previousSessions: { label: 'Previous period', color: '#93c5fd' },
} satisfies ChartConfig

function dateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function formatChange(value: number) {
  const rounded = Math.abs(Math.round(value * 10) / 10)
  return `${value >= 0 ? '↗' : '↘'} ${rounded}%`
}

function formatRangeLabel(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T00:00:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return `${startDate}–${endDate}`
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
  return `${startLabel}–${endLabel}`
}

const emptyPayload: SessionsAnalyticsPayload = {
  range: { startDate: '', endDate: '' },
  comparisonRange: { startDate: '', endDate: '' },
  refreshedAt: '',
  snapshot: {
    sessions: 0,
    visitors: 0,
    sessionsChange: 0,
    visitorsChange: 0,
  },
  series: [],
  rows: [],
}

export default function AdminSessionsPage() {
  const [payload, setPayload] = useState<SessionsAnalyticsPayload>(emptyPayload)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState(() => {
    const end = new Date()
    const start = new Date(end)
    start.setDate(start.getDate() - 59)
    return dateInputValue(start)
  })
  const [endDate, setEndDate] = useState(() => dateInputValue(new Date()))

  const loadSessions = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
      })

      const res = await fetch(`/api/admin/sessions?${params.toString()}`, {
        cache: 'no-store',
      })
      const data = (await res.json()) as SessionsAnalyticsPayload & {
        error?: string
      }
      if (!res.ok) throw new Error(data.error ?? 'Failed to load sessions')

      setPayload(data)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to load sessions',
      )
    } finally {
      setLoading(false)
    }
  }, [endDate, startDate])

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
  )
  const comparisonLabel = formatRangeLabel(
    payload.comparisonRange.startDate,
    payload.comparisonRange.endDate,
  )

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return payload.rows
    return payload.rows.filter((row) => row.label.toLowerCase().includes(q))
  }, [payload.rows, search])

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-600">
          <ChartColumn className="h-4 w-4 text-neutral-500" />
          <ChevronRight className="h-3.5 w-3.5 text-neutral-400" />
          <h1 className="text-base font-semibold text-neutral-950">
            Sessions over time
          </h1>
          <span className="text-neutral-500">Last refreshed: {refreshedLabel}</span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <label className="inline-flex h-9 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-700 shadow-sm">
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

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => void loadSessions()}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Apply
          </Button>

          <Button asChild variant="ghost" size="sm" className="h-9">
            <Link href="/admin">Back to dashboard</Link>
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-100 px-5 py-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-neutral-600">Sessions</p>
              <div className="mt-1 flex items-baseline gap-2">
                <p className="text-3xl font-semibold tracking-tight text-neutral-950">
                  {payload.snapshot.sessions.toLocaleString()}
                </p>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 text-sm font-medium',
                    payload.snapshot.sessionsChange >= 0
                      ? 'text-emerald-600'
                      : 'text-red-600',
                  )}
                >
                  <ArrowUpRight
                    className={cn(
                      'h-4 w-4',
                      payload.snapshot.sessionsChange < 0 && 'rotate-90',
                    )}
                  />
                  {formatChange(payload.snapshot.sessionsChange)}
                </span>
              </div>
            </div>
            <div className="text-right text-sm text-neutral-500">
              <p>{payload.snapshot.visitors.toLocaleString()} unique visitors</p>
              <p className="mt-0.5">{formatChange(payload.snapshot.visitorsChange)}</p>
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
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-neutral-600">
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#2563eb]" />
                {rangeLabel}
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full border border-[#93c5fd] bg-[#93c5fd]/40" />
                {comparisonLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="border-b border-neutral-100 px-5 py-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search days"
              className="h-9 border-neutral-200 pl-9 text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Day</TableHead>
                <TableHead className="text-right">Online store visitors</TableHead>
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
                    <TableCell className="text-neutral-950">{row.label}</TableCell>
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
