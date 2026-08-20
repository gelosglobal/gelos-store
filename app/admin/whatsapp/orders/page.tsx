'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Loader2, MessageCircle, RefreshCw, Search } from 'lucide-react'
import { toast } from 'sonner'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { Button } from '@/components/ui/button'
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

type WaAdminOrder = {
  order_id: string
  whatsapp_id: string
  customer_name: string
  alternate_phone: string | null
  delivery_area: string
  landmark: string | null
  payment_method: string
  payment_status: string
  payment_link: string | null
  total_ghs: number
  order_status: string
  created_at: string
  items: Array<{
    product_name: string
    variant: string | null
    quantity: number
  }>
}

function formatTime(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatMoney(value: number) {
  return `GHS ${Number(value).toFixed(2)}`
}

function statusTone(status: string) {
  const value = status.toLowerCase()
  if (value.includes('paid') || value.includes('delivered')) {
    return 'bg-emerald-100 text-emerald-800'
  }
  if (value.includes('await') || value.includes('pending')) {
    return 'bg-amber-100 text-amber-800'
  }
  if (value.includes('cancel') || value.includes('fail')) {
    return 'bg-rose-100 text-rose-800'
  }
  return 'bg-neutral-100 text-neutral-700'
}

export default function AdminWhatsappOrdersPage() {
  const [orders, setOrders] = useState<WaAdminOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const loadOrders = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/whatsapp/orders', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to load orders')
      setOrders((data.orders ?? []) as WaAdminOrder[])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadOrders()
  }, [loadOrders])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return orders
    return orders.filter((order) => {
      const haystack = [
        order.order_id,
        order.customer_name,
        order.whatsapp_id,
        order.delivery_area,
        order.payment_method,
        order.payment_status,
        order.order_status,
        ...(order.items || []).map((item) => item.product_name),
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [orders, search])

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="WhatsApp orders"
        description="Orders placed through the WhatsApp agent."
      >
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-2"
          onClick={() => void loadOrders()}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </Button>
      </AdminPageHeader>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order, customer, phone…"
            className="h-9 pl-9"
          />
        </div>
        <p className="text-sm text-neutral-500">
          {filtered.length} order{filtered.length === 1 ? '' : 's'}
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        {loading ? (
          <div className="flex items-center gap-2 p-6 text-sm text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading WhatsApp orders…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-10 text-center text-sm text-neutral-500">
            <MessageCircle className="h-6 w-6 text-neutral-400" />
            <p>No WhatsApp orders yet.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Chat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((order) => {
                const itemPreview = (order.items || [])
                  .map((item) => {
                    const variant = item.variant ? ` (${item.variant})` : ''
                    return `${item.quantity}× ${item.product_name}${variant}`
                  })
                  .join(', ')
                return (
                  <TableRow key={order.order_id}>
                    <TableCell className="font-medium text-neutral-950">
                      {order.order_id}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-neutral-900">
                        {order.customer_name}
                      </p>
                      <p className="text-xs text-neutral-500">
                        +{order.whatsapp_id}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {order.delivery_area}
                        {order.landmark ? ` · ${order.landmark}` : ''}
                      </p>
                    </TableCell>
                    <TableCell className="max-w-[220px]">
                      <p className="truncate text-sm text-neutral-700">
                        {itemPreview || '—'}
                      </p>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatMoney(order.total_ghs)}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-neutral-800">
                        {order.payment_method}
                      </p>
                      <span
                        className={cn(
                          'mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium',
                          statusTone(order.payment_status),
                        )}
                      >
                        {order.payment_status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium',
                          statusTone(order.order_status),
                        )}
                      >
                        {order.order_status}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-neutral-600">
                      {formatTime(order.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm" className="h-8">
                        <Link
                          href={`/admin/whatsapp?c=${encodeURIComponent(order.whatsapp_id)}`}
                        >
                          Open chat
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
