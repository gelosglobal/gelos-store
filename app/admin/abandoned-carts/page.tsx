'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Clock3,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  ShoppingBasket,
} from 'lucide-react'
import { toast } from 'sonner'
import type { AdminAbandonedCheckoutsPayload } from '@/lib/db/abandoned-checkouts'
import { formatOrderDateLabel, formatOrderTotal } from '@/lib/admin/order-format'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

const emptyPayload: AdminAbandonedCheckoutsPayload = {
  checkouts: [],
  summary: { total: 0, withEmail: 0, totalValue: 0, totalValueCurrency: null, today: 0 },
  graceMinutes: 5,
  refreshedAt: '',
}

function formatAbandonedDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function customerLabel(row: AdminAbandonedCheckoutsPayload['checkouts'][number]) {
  if (row.customerName) return row.customerName
  if (row.customerEmail) return row.customerEmail
  return 'Anonymous visitor'
}

export default function AdminAbandonedCartsPage() {
  const [data, setData] = useState<AdminAbandonedCheckoutsPayload>(emptyPayload)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/abandoned-checkouts', {
        cache: 'no-store',
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setData({ ...emptyPayload, ...json })
    } catch {
      toast.error('Failed to load abandoned checkouts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
    const interval = window.setInterval(() => {
      void load()
    }, 30_000)
    return () => window.clearInterval(interval)
  }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return data.checkouts
    return data.checkouts.filter((row) =>
      [
        row.customerName,
        row.customerEmail,
        row.customerPhone,
        row.locationId,
        ...row.items.map((item) => item.name),
      ]
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }, [data.checkouts, search])

  const refreshedLabel = data.refreshedAt
    ? new Date(data.refreshedAt).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })
    : '—'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-950">
            Abandoned checkouts
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Shoppers who started checkout but did not complete an order.
          </p>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-neutral-500">
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          Updated {refreshedLabel}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Abandoned now
          </p>
          <p className="mt-1 text-2xl font-bold text-neutral-950">
            {data.summary.total}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Started today
          </p>
          <p className="mt-1 text-2xl font-bold text-neutral-950">
            {data.summary.today}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            With email
          </p>
          <p className="mt-1 text-2xl font-bold text-neutral-950">
            {data.summary.withEmail}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Checkout value
          </p>
          <p className="mt-1 text-2xl font-bold text-neutral-950">
            {data.summary.totalValueCurrency
              ? formatOrderTotal(
                  data.summary.totalValueCurrency,
                  data.summary.totalValue,
                )
              : data.summary.total > 0
                ? 'Mixed currencies'
                : formatOrderTotal('GHS', 0)}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-neutral-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search customer, email, or product"
              className="pl-9"
            />
          </div>
          <p className="text-xs text-neutral-500">
            Listed after {data.graceMinutes} min away from checkout
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-neutral-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading abandoned checkouts…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <ShoppingBasket className="h-8 w-8 text-neutral-300" />
            <p className="text-sm font-medium text-neutral-700">
              No abandoned checkouts right now
            </p>
            <p className="max-w-sm text-sm text-neutral-500">
              When someone opens checkout and leaves without placing an order,
              they will appear here.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Market</TableHead>
                <TableHead>Last active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium text-neutral-900">
                        {customerLabel(row)}
                      </p>
                      {row.customerEmail ? (
                        <p className="flex items-center gap-1 text-xs text-neutral-500">
                          <Mail className="h-3.5 w-3.5" />
                          {row.customerEmail}
                        </p>
                      ) : (
                        <p className="text-xs text-neutral-400">
                          Left before entering email
                        </p>
                      )}
                      {row.customerPhone ? (
                        <p className="text-xs text-neutral-500">{row.customerPhone}</p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-neutral-800">
                      {row.itemCount} item{row.itemCount === 1 ? '' : 's'}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-neutral-500">
                      {row.items.map((item) => item.name).join(', ')}
                    </p>
                  </TableCell>
                  <TableCell className="font-medium text-neutral-900">
                    {formatOrderTotal(row.currency, row.total)}
                  </TableCell>
                  <TableCell className="capitalize text-neutral-600">
                    {row.locationId || '—'}
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-neutral-800">
                      {formatOrderDateLabel(new Date(row.lastSeenAt))}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-neutral-500">
                      <Clock3 className="h-3.5 w-3.5" />
                      Left {formatAbandonedDuration(row.abandonedMinutes)}
                    </p>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
