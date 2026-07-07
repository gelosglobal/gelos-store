'use client'

import Link from 'next/link'
import {
  ArrowLeft,
  Copy,
  Pencil,
  ShoppingCart,
  Trash2,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import { AdminStatCard } from '@/components/admin/admin-stat-card'
import { AffiliatePaymentDetails } from '@/components/admin/affiliate-payment-details'
import { AffiliatePayoutDialog } from '@/components/admin/affiliate-payout-dialog'
import { formatOrderTotal } from '@/lib/admin/order-format'
import type { AdminAffiliateDetail } from '@/lib/types/affiliate'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type AffiliateDetailViewProps = {
  affiliate: AdminAffiliateDetail
  payoutDialogOpen: boolean
  processingPayout: boolean
  onPayoutDialogOpenChange: (open: boolean) => void
  onConfirmPayout: () => void
  onEdit: () => void
  onDelete: () => void
}

export function AffiliateDetailView({
  affiliate,
  payoutDialogOpen,
  processingPayout,
  onPayoutDialogOpenChange,
  onConfirmPayout,
  onEdit,
  onDelete,
}: AffiliateDetailViewProps) {
  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(affiliate.referralUrl)
      toast.success('Referral link copied')
    } catch {
      toast.error('Could not copy link')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="-ml-2 h-8 gap-1.5 px-2 text-neutral-600"
          >
            <Link href="/admin/affiliates">
              <ArrowLeft className="h-4 w-4" />
              All affiliates
            </Link>
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
                {affiliate.name}
              </h1>
              <Badge
                variant={affiliate.enabled ? 'default' : 'secondary'}
                className={
                  affiliate.enabled
                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'
                    : ''
                }
              >
                {affiliate.enabled ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-neutral-600">
              Code{' '}
              <span className="font-mono font-semibold text-neutral-900">
                {affiliate.code}
              </span>
              {' · '}
              {affiliate.commissionPercent}% commission
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
          <Button
            type="button"
            size="sm"
            className="bg-neutral-950 text-white hover:bg-neutral-800"
            disabled={affiliate.pendingCommission <= 0}
            onClick={() => onPayoutDialogOpenChange(true)}
          >
            <Wallet className="h-4 w-4" />
            Pay out
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Total orders"
          value={affiliate.totalOrders}
          hint="Attributed referrals"
          icon={ShoppingCart}
        />
        <AdminStatCard
          label="Total revenue"
          value={formatOrderTotal('GHS', affiliate.totalRevenue)}
          hint="From referred orders"
          icon={ShoppingCart}
        />
        <AdminStatCard
          label="Pending commission"
          value={formatOrderTotal('GHS', affiliate.pendingCommission)}
          hint="Ready to pay out"
          icon={Wallet}
        />
        <AdminStatCard
          label="Paid commission"
          value={formatOrderTotal('GHS', affiliate.paidCommission)}
          hint="Lifetime payouts"
          icon={Wallet}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="rounded-xl border-neutral-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Referred orders</CardTitle>
            <CardDescription>
              Last {Math.min(50, affiliate.recentOrders.length)} orders attributed
              to this affiliate.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {affiliate.recentOrders.length === 0 ? (
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-6 py-10 text-center text-sm text-neutral-600">
                No attributed orders yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {affiliate.recentOrders.map((order) => (
                    <TableRow key={order.orderNumber}>
                      <TableCell className="font-medium text-neutral-950">
                        {order.orderNumber}
                      </TableCell>
                      <TableCell className="text-neutral-600">
                        {order.dateLabel}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatOrderTotal(order.currency, order.total)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
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

        <div className="space-y-6">
          <Card className="rounded-xl border-neutral-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Payout method</CardTitle>
              <CardDescription>
                {affiliate.payoutConfigured
                  ? 'Send commission to this payment method.'
                  : 'This affiliate has not added payout details yet.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <AffiliatePaymentDetails affiliate={affiliate} />
              <Button
                type="button"
                className="w-full gap-2 bg-neutral-950 text-white hover:bg-neutral-800"
                disabled={affiliate.pendingCommission <= 0}
                onClick={() => onPayoutDialogOpenChange(true)}
              >
                <Wallet className="h-4 w-4" />
                Pay out {formatOrderTotal('GHS', affiliate.pendingCommission)}
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-neutral-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Email
                </p>
                <p className="mt-1 text-neutral-950">
                  {affiliate.email || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Phone
                </p>
                <p className="mt-1 text-neutral-950">
                  {affiliate.phone || '—'}
                </p>
              </div>
              {affiliate.notes ? (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                    Notes
                  </p>
                  <p className="mt-1 text-neutral-700">{affiliate.notes}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="rounded-xl border-neutral-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Referral link</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                readOnly
                value={affiliate.referralUrl}
                className="font-mono text-xs"
              />
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={() => void copyReferralLink()}
              >
                <Copy className="h-4 w-4" />
                Copy referral link
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <AffiliatePayoutDialog
        open={payoutDialogOpen}
        onOpenChange={onPayoutDialogOpenChange}
        affiliate={affiliate}
        processing={processingPayout}
        onConfirm={onConfirmPayout}
      />
    </div>
  )
}
