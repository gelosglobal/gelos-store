'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Package,
  ShoppingCart,
  Users,
  AlertTriangle,
  Droplets,
  Sparkles,
} from 'lucide-react'
import { orders } from '@/lib/mock-data'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminStatCard } from '@/components/admin/admin-stat-card'
import { DatabaseStatusBanner } from '@/components/admin/database-status-banner'
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

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})
  }, [])

  const recentOrders = orders.slice(0, 5)

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Dashboard"
        description="Overview of your Gelos store catalog and operations."
      >
        <Button asChild className="rounded-full bg-neutral-950 hover:bg-neutral-800">
          <Link href="/admin/products">Manage products</Link>
        </Button>
      </AdminPageHeader>

      {stats && <DatabaseStatusBanner connected={stats.databaseConnected} />}

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
                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-neutral-100 last:border-0"
                  >
                    <td className="px-4 py-3 font-medium">{order.orderNumber}</td>
                    <td className="px-4 py-3 text-neutral-600">
                      {order.customer}
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#E91E8C]">
                      GH₵{order.total.toFixed(0)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold">
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
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

          {stats && stats.categories.length > 0 && (
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
              value={stats?.totalOrders ?? orders.length}
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
