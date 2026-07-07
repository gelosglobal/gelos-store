'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { Check, Copy, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import type { AffiliateDashboardPayload } from '@/lib/db/affiliate-dashboard'
import { formatOrderTotal } from '@/lib/admin/order-format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

async function copyText(text: string) {
  await navigator.clipboard.writeText(text)
}

const AFFILIATE_PROFILE_IMAGE = '/Prata.jpeg'

export function AffiliateDashboardView() {
  const [loading, setLoading] = useState(true)
  const [payload, setPayload] = useState<AffiliateDashboardPayload | null>(null)
  const [copied, setCopied] = useState(false)

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/affiliate/dashboard', { cache: 'no-store' })
      const data = (await res.json()) as AffiliateDashboardPayload & {
        error?: string
      }
      if (!res.ok) throw new Error(data.error ?? 'Failed to load dashboard')
      setPayload(data)
    } catch (error) {
      setPayload(null)
      toast.error(
        error instanceof Error ? error.message : 'Failed to load dashboard',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  const copyReferralLink = async () => {
    if (!payload?.affiliate.referralUrl) return
    try {
      await copyText(payload.affiliate.referralUrl)
      setCopied(true)
      toast.success('Referral link copied')
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy link')
    }
  }

  const affiliate = payload?.affiliate
  const stats = payload?.stats
  const recentOrders = payload?.recentOrders ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <Image
            src={AFFILIATE_PROFILE_IMAGE}
            alt="Affiliate profile"
            width={56}
            height={56}
            className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-white shadow-sm"
          />
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
              {affiliate ? `Hi, ${affiliate.name.split(' ')[0]}` : 'Dashboard'}
            </h1>
            {affiliate ? (
              <p className="mt-1 text-sm text-neutral-600">
                Code{' '}
                <span className="font-mono font-semibold text-neutral-900">
                  {affiliate.code}
                </span>
                {' · '}
                {affiliate.commissionPercent}% commission
              </p>
            ) : null}
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 gap-2 rounded-full"
          onClick={() => loadDashboard()}
          disabled={loading}
        >
          <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {loading && !payload ? (
        <div className="flex items-center justify-center rounded-3xl border border-neutral-200 bg-white py-20">
          <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
        </div>
      ) : null}

      {affiliate && stats ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="rounded-2xl border-neutral-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription>Total orders</CardDescription>
                <CardTitle className="text-2xl">{stats.totalOrders}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="rounded-2xl border-neutral-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription>Total revenue</CardDescription>
                <CardTitle className="text-2xl">
                  {formatOrderTotal('GHS', stats.totalRevenue)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="rounded-2xl border-neutral-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription>Pending commission</CardDescription>
                <CardTitle className="text-2xl">
                  {formatOrderTotal('GHS', stats.pendingCommission)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="rounded-2xl border-neutral-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription>Paid commission</CardDescription>
                <CardTitle className="text-2xl">
                  {formatOrderTotal('GHS', stats.paidCommission)}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card
            id="referral"
            className="scroll-mt-24 rounded-2xl border-neutral-200 shadow-sm"
          >
            <CardHeader className="pb-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="text-lg">Your referral link</CardTitle>
                  <CardDescription>
                    Share this link to earn commission on purchases.
                  </CardDescription>
                </div>
                <Badge
                  variant={affiliate.enabled ? 'default' : 'secondary'}
                  className={
                    affiliate.enabled ? 'bg-emerald-100 text-emerald-800' : ''
                  }
                >
                  {affiliate.enabled ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Input
                  readOnly
                  value={affiliate.referralUrl}
                  className="h-10 font-mono text-xs sm:text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 gap-2"
                  onClick={copyReferralLink}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  Copy
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card
            id="orders"
            className="scroll-mt-24 rounded-2xl border-neutral-200 shadow-sm"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Recent referred orders</CardTitle>
              <CardDescription>
                Last {Math.min(50, recentOrders.length)} orders attributed to your code.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {recentOrders.length === 0 ? (
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-6 py-10 text-center text-sm text-neutral-600">
                  No orders attributed yet. Share your referral link to start earning.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Commission</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.map((order) => (
                      <TableRow key={order.orderNumber}>
                        <TableCell className="font-medium text-neutral-950">
                          {order.orderNumber}
                        </TableCell>
                        <TableCell className="text-neutral-600">
                          {order.dateLabel}
                        </TableCell>
                        <TableCell className="text-neutral-600">
                          {order.channel}
                        </TableCell>
                        <TableCell className="text-right font-medium text-neutral-950">
                          {formatOrderTotal(order.currency, order.total)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-neutral-950">
                          {formatOrderTotal(order.currency, order.commissionAmount)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              order.commissionStatus === 'paid'
                                ? 'default'
                                : order.commissionStatus === 'pending'
                                  ? 'secondary'
                                  : 'outline'
                            }
                            className={
                              order.commissionStatus === 'paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : order.commissionStatus === 'pending'
                                  ? 'bg-amber-100 text-amber-900'
                                  : ''
                            }
                          >
                            {order.commissionStatus}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}
