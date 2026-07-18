'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Package,
  ShoppingCart,
  Users,
  AlertTriangle,
  Droplets,
  Sparkles,
} from 'lucide-react'
import { formatOrderTotal } from '@/lib/admin/order-format'
import type {
  AnalyticsCustomRange,
  AnalyticsPayload,
  AnalyticsPeriod,
} from '@/lib/admin/analytics-types'
import type { StoreOrder } from '@/lib/types/order'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminStatCard } from '@/components/admin/admin-stat-card'
import { AnalyticsOverviewHeader } from '@/components/admin/analytics-overview-header'
import { LiveVisitorsPanel } from '@/components/admin/live-visitors-panel'
import { Button } from '@/components/ui/button'

type Stats = {
  totalProducts: number
  lowStock: number
  toothpasteCount: number
  mouthwashCount: number
  totalOrders: number
  totalCustomers: number
  databaseConnected: boolean
  categories: { name: string; count: number }[]
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

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentOrders, setRecentOrders] = useState<StoreOrder[]>([])
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
  const [analytics, setAnalytics] = useState<AnalyticsPayload>(emptyAnalytics)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)
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
      if (!res.ok) return

      setAnalytics({
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
      // ignore
    } finally {
      setAnalyticsLoading(false)
    }
  }, [customRange.endDate, customRange.startDate, period])

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((data: Stats & { error?: string }) => {
        if (data.error) return
        setStats(data)
      })
      .catch(() => {})

    fetch('/api/admin/orders', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => setRecentOrders((data.orders ?? []).slice(0, 5)))
      .catch(() => {})
  }, [])

  useEffect(() => {
    setAnalyticsLoading(true)
    loadAnalytics()
  }, [loadAnalytics])

  return (
    <div className="space-y-6">
      <AnalyticsOverviewHeader
        period={period}
        onPeriodChange={setPeriod}
        customStartDate={customRange.startDate}
        customEndDate={customRange.endDate}
        onCustomRangeChange={setCustomRange}
        snapshot={analytics.snapshot}
        series={analytics.series}
        loading={analyticsLoading}
        liveVisitorsExpanded={showLiveActivity}
        onLiveVisitorsClick={() => setShowLiveActivity((open) => !open)}
      />

      {showLiveActivity ? <LiveVisitorsPanel compact /> : null}

      <AdminPageHeader
        title="Dashboard"
        description="Overview of your Gelos store catalog and operations."
      >
        <Button asChild className="rounded-full bg-neutral-950 hover:bg-neutral-800">
          <Link href="/admin/products">Manage products</Link>
        </Button>
      </AdminPageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard
          label="Products"
          value={stats?.totalProducts ?? '—'}
          hint="In catalog"
          icon={Package}
        />
        <AdminStatCard
          label="Toothpaste"
          value={stats?.toothpasteCount ?? '—'}
          hint="GH₵80 each"
          icon={Droplets}
        />
        <AdminStatCard
          label="Mouthwash"
          value={stats?.mouthwashCount ?? '—'}
          hint="GH₵88 each"
          icon={Sparkles}
        />
        <AdminStatCard
          label="Low stock"
          value={stats?.lowStock ?? '—'}
          hint="Under 20 units"
          icon={AlertTriangle}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-950">
              Recent orders
            </h2>
            <Link
              href="/admin/orders"
              className="text-sm font-semibold text-neutral-600 hover:text-neutral-950"
            >
              View all →
            </Link>
          </div>
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50/80 text-left">
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Total</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-sm text-neutral-500"
                    >
                      No orders yet
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-neutral-100 last:border-0"
                    >
                      <td className="px-4 py-3 font-medium">
                        {order.orderNumber}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {order.customer}
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#E91E8C]">
                        {formatOrderTotal(order.currency, order.total)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold">
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-neutral-950">
            Quick actions
          </h2>
          <div className="space-y-2 rounded-2xl border border-neutral-200 bg-white p-4">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/admin/products">
                <Package className="mr-2 h-4 w-4" />
                Add or edit products
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/admin/collections">
                <Package className="mr-2 h-4 w-4" />
                View collections
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/admin/orders">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Manage orders
              </Link>
            </Button>
          </div>

          {stats?.categories && stats.categories.length > 0 && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-neutral-950">
                By category
              </h3>
              <ul className="mt-3 space-y-2">
                {stats.categories.slice(0, 6).map((cat) => (
                  <li
                    key={cat.name}
                    className="flex justify-between text-sm text-neutral-600"
                  >
                    <span>{cat.name}</span>
                    <span className="font-semibold text-neutral-950">
                      {cat.count}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <AdminStatCard
              label="Orders"
              value={stats?.totalOrders ?? '—'}
              icon={ShoppingCart}
            />
            <AdminStatCard
              label="Customers"
              value={stats?.totalCustomers ?? '—'}
              icon={Users}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
