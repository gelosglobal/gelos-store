'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Loader2,
  Plus,
  Search,
  ShoppingBag,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  FulfillmentStatusBadge,
  PaymentStatusBadge,
} from '@/components/admin/order-status-badge'
import { formatOrderTotal } from '@/lib/admin/order-format'
import { getOrderStats } from '@/lib/admin/orders-data'
import type { StoreOrder } from '@/lib/types/order'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

type TabFilter = 'all' | 'unfulfilled' | 'pending'

function MiniSparkline({ active }: { active?: boolean }) {
  return (
    <svg
      viewBox="0 0 48 20"
      className="h-5 w-12 text-sky-500"
      aria-hidden
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={
          active
            ? '0,14 8,10 16,12 24,6 32,8 40,4 48,2'
            : '0,10 12,10 24,10 36,10 48,10'
        }
      />
    </svg>
  )
}

export default function AdminOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<StoreOrder[]>([])
  const [databaseConnected, setDatabaseConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<TabFilter>('all')
  const [period, setPeriod] = useState<'today' | 'all'>('today')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [backfilling, setBackfilling] = useState(false)
  const pageSize = 50

  const loadOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/orders', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setOrders(data.orders ?? [])
      setDatabaseConnected(Boolean(data.databaseConnected))
    } catch {
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadOrders()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [loadOrders])

  const stats = useMemo(() => getOrderStats(orders, period), [orders, period])

  const filtered = useMemo(() => {
    return orders.filter((order) => {
      const q = search.toLowerCase()
      const matchesSearch =
        !q ||
        order.orderNumber.toLowerCase().includes(q) ||
        order.customer.toLowerCase().includes(q) ||
        order.id.toLowerCase().includes(q)
      const matchesTab =
        tab === 'all' ||
        (tab === 'unfulfilled' && order.fulfillmentStatus === 'Unfulfilled') ||
        (tab === 'pending' && order.paymentStatus === 'Payment pending')
      return matchesSearch && matchesTab
    })
  }, [orders, search, tab])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelected(new Set(paged.map((o) => o.id)))
    } else {
      setSelected(new Set())
    }
  }

  const toggleOne = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const allSelected = paged.length > 0 && paged.every((o) => selected.has(o.id))

  const openOrderDetail = (orderId: string) => {
    router.push(`/admin/orders/${orderId}`)
  }

  const backfillMissingItems = async () => {
    if (backfilling) return
    setBackfilling(true)
    try {
      const res = await fetch('/api/admin/orders/backfill-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = (await res.json()) as {
        error?: string
        scanned?: number
        recovered?: number
        failed?: number
        skipped?: number
      }
      if (!res.ok) throw new Error(data.error ?? 'Backfill failed')

      toast.success(
        `Checked ${data.scanned ?? 0} empty orders · restored ${data.recovered ?? 0} · failed ${data.failed ?? 0}`,
      )
      await loadOrders()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to restore order items',
      )
    } finally {
      setBackfilling(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-neutral-700" />
            <h1 className="text-lg font-semibold text-neutral-950">Orders</h1>
            <Select defaultValue="all">
              <SelectTrigger className="h-8 w-[130px] border-neutral-200 text-sm">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All locations</SelectItem>
                <SelectItem value="gh">Ghana</SelectItem>
                <SelectItem value="ng">Nigeria</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1"
              disabled={backfilling}
              onClick={() => void backfillMissingItems()}
            >
              {backfilling ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ShoppingBag className="h-3.5 w-3.5" />
              )}
              Restore missing items
            </Button>
            <Button variant="outline" size="sm" className="h-8">
              Export
            </Button>
            <Button variant="outline" size="sm" className="h-8 gap-1">
              More actions
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              className="h-8 gap-1 bg-neutral-950 hover:bg-neutral-800"
            >
              <Plus className="h-3.5 w-3.5" />
              Create order
            </Button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex flex-wrap items-stretch divide-x divide-neutral-200 border-b border-neutral-200">
          <div className="flex min-w-[100px] items-center px-4 py-3">
            <Select
              value={period}
              onValueChange={(v) => setPeriod(v as 'today' | 'all')}
            >
              <SelectTrigger className="h-8 border-0 bg-transparent px-0 text-sm font-medium shadow-none focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {[
            {
              label: 'Orders',
              value: stats.orders,
              spark: true,
            },
            {
              label: 'Items ordered',
              value: stats.itemsOrdered,
              spark: true,
            },
            {
              label: 'Returns',
              value: formatOrderTotal('GHS', stats.returns),
              spark: false,
            },
            {
              label: 'Orders fulfilled',
              value: stats.fulfilled,
              spark: false,
            },
            {
              label: 'Orders delivered',
              value: stats.delivered,
              spark: false,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex min-w-[120px] flex-1 flex-col justify-center px-4 py-3"
            >
              <p className="text-xs text-neutral-500">{stat.label}</p>
              <div className="mt-0.5 flex items-end justify-between gap-2">
                <p className="text-lg font-semibold text-neutral-950">
                  {stat.value}
                </p>
                <MiniSparkline active={stat.spark} />
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 px-4 py-2 sm:px-5">
          <div className="flex items-center gap-1">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'unfulfilled', label: 'Unfulfilled' },
                { id: 'pending', label: 'Payment pending' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTab(t.id)
                  setPage(1)
                }}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                  tab === t.id
                    ? 'bg-neutral-100 text-neutral-950'
                    : 'text-neutral-600 hover:bg-neutral-50',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="relative ml-auto min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Search and filter (/)"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="h-9 border-neutral-200 pl-9 text-sm"
            />
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10 pl-4">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(c) => toggleAll(Boolean(c))}
                    aria-label="Select all orders"
                  />
                </TableHead>
                <TableHead className="font-semibold text-neutral-600">
                  Order
                </TableHead>
                <TableHead className="font-semibold text-neutral-600">
                  <span className="inline-flex items-center gap-1">
                    Date
                    <ChevronDown className="h-3.5 w-3.5" />
                  </span>
                </TableHead>
                <TableHead className="font-semibold text-neutral-600">
                  Customer
                </TableHead>
                <TableHead className="font-semibold text-neutral-600">
                  Fulfill by
                </TableHead>
                <TableHead className="font-semibold text-neutral-600">
                  Channel
                </TableHead>
                <TableHead className="font-semibold text-neutral-600">
                  Total
                </TableHead>
                <TableHead className="font-semibold text-neutral-600">
                  Payment status
                </TableHead>
                <TableHead className="font-semibold text-neutral-600">
                  Fulfillment status
                </TableHead>
                <TableHead className="font-semibold text-neutral-600">
                  Items
                </TableHead>
                <TableHead className="font-semibold text-neutral-600">
                  Delivery status
                </TableHead>
                <TableHead className="pr-4 font-semibold text-neutral-600">
                  Delivery method
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={12}
                    className="py-12 text-center text-sm text-neutral-500"
                  >
                    Loading orders…
                  </TableCell>
                </TableRow>
              ) : paged.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={12}
                    className="py-12 text-center text-sm text-neutral-500"
                  >
                    {databaseConnected
                      ? 'No orders yet. New checkouts will appear here.'
                      : 'Connect your database to view live orders.'}
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((order) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    checked={selected.has(order.id)}
                    onCheckedChange={(c) => toggleOne(order.id, c)}
                    onOpen={() => openOrderDetail(order.id)}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-3 text-sm text-neutral-600 sm:px-5">
          <span>
            {filtered.length === 0
              ? '0 orders'
              : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, filtered.length)} of ${filtered.length}`}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[3rem] text-center font-medium">
              {page}-{pageCount}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page >= pageCount}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function OrderRow({
  order,
  checked,
  onCheckedChange,
  onOpen,
}: {
  order: StoreOrder
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  onOpen: () => void
}) {
  return (
    <TableRow
      className="cursor-pointer hover:bg-neutral-50/80"
      onClick={onOpen}
    >
      <TableCell className="pl-4" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={checked}
          onCheckedChange={(c) => onCheckedChange(Boolean(c))}
          aria-label={`Select ${order.orderNumber}`}
        />
      </TableCell>
      <TableCell className="font-medium text-neutral-950">
        {order.orderNumber}
      </TableCell>
      <TableCell className="whitespace-nowrap text-neutral-600">
        {order.dateLabel}
      </TableCell>
      <TableCell className="text-neutral-950">{order.customer}</TableCell>
      <TableCell className="text-neutral-400">
        {order.fulfillBy ?? '—'}
      </TableCell>
      <TableCell className="text-neutral-600">{order.channel}</TableCell>
      <TableCell className="font-medium text-neutral-950">
        {formatOrderTotal(order.currency, order.total)}
      </TableCell>
      <TableCell>
        <PaymentStatusBadge status={order.paymentStatus} />
      </TableCell>
      <TableCell>
        <FulfillmentStatusBadge status={order.fulfillmentStatus} />
      </TableCell>
      <TableCell className="text-neutral-600">
        {order.items} {order.items === 1 ? 'item' : 'items'}
      </TableCell>
      <TableCell className="text-neutral-400">
        {order.deliveryStatus ?? '—'}
      </TableCell>
      <TableCell className="pr-4 text-neutral-600">
        {order.deliveryMethod}
      </TableCell>
    </TableRow>
  )
}
