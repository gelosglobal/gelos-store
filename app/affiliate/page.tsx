'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Check, Copy, Loader2, RefreshCw, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { normalizeAffiliateCode } from '@/lib/affiliates'
import { formatOrderTotal } from '@/lib/admin/order-format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

const DASHBOARD_CODE_STORAGE_KEY = 'gelos-affiliate-dashboard-code'

type DashboardAffiliate = {
  id: string
  code: string
  name: string
  commissionPercent: number
  enabled: boolean
  referralUrl: string
}

type DashboardStats = {
  totalOrders: number
  totalRevenue: number
  totalCommission: number
  pendingCommission: number
  paidCommission: number
}

type DashboardOrder = {
  orderNumber: string
  date: string
  dateLabel: string
  total: number
  currency: string
  commissionAmount: number
  commissionStatus: string
  channel: string
}

type DashboardPayload = {
  affiliate: DashboardAffiliate
  stats: DashboardStats
  recentOrders: DashboardOrder[]
}

function readStoredDashboardCode(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(DASHBOARD_CODE_STORAGE_KEY)?.trim() ?? ''
}

function writeStoredDashboardCode(code: string) {
  if (typeof window === 'undefined') return
  if (code) localStorage.setItem(DASHBOARD_CODE_STORAGE_KEY, code)
  else localStorage.removeItem(DASHBOARD_CODE_STORAGE_KEY)
}

async function copyText(text: string) {
  await navigator.clipboard.writeText(text)
}

export default function AffiliateDashboardPage() {
  const [codeInput, setCodeInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [payload, setPayload] = useState<DashboardPayload | null>(null)
  const [copied, setCopied] = useState(false)

  const normalizedCode = useMemo(
    () => normalizeAffiliateCode(codeInput),
    [codeInput],
  )

  const loadDashboard = useCallback(async (code: string) => {
    const normalized = normalizeAffiliateCode(code)
    if (!normalized) return

    setLoading(true)
    try {
      const res = await fetch(
        `/api/store/affiliate/dashboard?code=${encodeURIComponent(normalized)}`,
        { cache: 'no-store' },
      )
      const data = (await res.json()) as DashboardPayload & { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Failed to load dashboard')

      setPayload(data)
      writeStoredDashboardCode(normalized)
      setCodeInput(normalized)
    } catch (error) {
      setPayload(null)
      toast.error(error instanceof Error ? error.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const stored = readStoredDashboardCode()
    if (stored) void loadDashboard(stored)
  }, [loadDashboard])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!normalizedCode) {
      toast.error('Enter your affiliate code')
      return
    }
    await loadDashboard(normalizedCode)
  }

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

  const stats = payload?.stats
  const affiliate = payload?.affiliate
  const recentOrders = payload?.recentOrders ?? []

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-12 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">
              Gelos partners
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">
              Affiliate dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-neutral-600 sm:text-base">
              Track your referred orders and commission. Enter your affiliate code to continue.
            </p>
            <Link
              href="/affiliate/register"
              className="mt-3 inline-flex text-sm font-semibold text-neutral-800 underline-offset-4 hover:underline"
            >
              Not a partner yet? Register as an affiliate
            </Link>
          </div>
          <Link
            href="/"
            className="text-sm font-semibold text-neutral-700 underline-offset-4 hover:text-neutral-950 hover:underline"
          >
            Back to store
          </Link>
        </div>

        <Card className="rounded-3xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Sign in with code</CardTitle>
            <CardDescription>
              Use the referral code your admin gave you (example: <span className="font-mono">AMA10</span>).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="affiliate-code">Affiliate code</Label>
                <Input
                  id="affiliate-code"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                  placeholder="AMA10"
                  className="h-10 font-mono"
                />
              </div>
              <Button
                type="submit"
                className="h-10 bg-neutral-950 hover:bg-neutral-800"
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {loading ? 'Loading…' : 'Open dashboard'}
              </Button>
              {affiliate ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-10"
                  onClick={() => loadDashboard(affiliate.code)}
                  disabled={loading}
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              ) : null}
            </form>
          </CardContent>
        </Card>

        {affiliate && stats ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="rounded-3xl">
                <CardHeader className="pb-2">
                  <CardDescription>Total orders</CardDescription>
                  <CardTitle className="text-2xl">{stats.totalOrders}</CardTitle>
                </CardHeader>
              </Card>
              <Card className="rounded-3xl">
                <CardHeader className="pb-2">
                  <CardDescription>Total revenue</CardDescription>
                  <CardTitle className="text-2xl">
                    {formatOrderTotal('GHS', stats.totalRevenue)}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="rounded-3xl">
                <CardHeader className="pb-2">
                  <CardDescription>Pending commission</CardDescription>
                  <CardTitle className="text-2xl">
                    {formatOrderTotal('GHS', stats.pendingCommission)}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="rounded-3xl">
                <CardHeader className="pb-2">
                  <CardDescription>Paid commission</CardDescription>
                  <CardTitle className="text-2xl">
                    {formatOrderTotal('GHS', stats.paidCommission)}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            <Card className="rounded-3xl">
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
                      affiliate.enabled
                        ? 'bg-emerald-100 text-emerald-800'
                        : ''
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

            <Card className="rounded-3xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Recent referred orders</CardTitle>
                <CardDescription>
                  Last {Math.min(50, recentOrders.length)} orders attributed to your code.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {recentOrders.length === 0 ? (
                  <div className="rounded-2xl border border-neutral-200 bg-white px-6 py-10 text-center text-sm text-neutral-600">
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
    </div>
  )
}

