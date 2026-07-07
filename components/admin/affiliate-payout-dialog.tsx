'use client'

import { Loader2, Wallet } from 'lucide-react'
import { formatOrderTotal } from '@/lib/admin/order-format'
import type { StoreAffiliate } from '@/lib/types/affiliate'
import { AffiliatePaymentDetails } from '@/components/admin/affiliate-payment-details'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type AffiliatePayoutDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  affiliate: StoreAffiliate | null
  processing: boolean
  onConfirm: () => void
}

export function AffiliatePayoutDialog({
  open,
  onOpenChange,
  affiliate,
  processing,
  onConfirm,
}: AffiliatePayoutDialogProps) {
  if (!affiliate) return null

  const payoutAmount = affiliate.pendingCommission

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-neutral-200 px-6 py-4">
          <DialogTitle className="text-base font-semibold text-neutral-950">
            Pay out commission
          </DialogTitle>
          <DialogDescription>
            Confirm payout for {affiliate.name} ({affiliate.code}).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-6 py-5">
          <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-4">
            <p className="text-sm text-neutral-500">Pending commission</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-neutral-950">
              {formatOrderTotal('GHS', payoutAmount)}
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-neutral-950">Payment details</p>
            {affiliate.payoutConfigured ? (
              <AffiliatePaymentDetails affiliate={affiliate} />
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                This affiliate has not added payout details yet. You can still mark
                the commission as paid after sending payment manually.
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="border-t border-neutral-200 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={processing}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="gap-2 bg-neutral-950 text-white hover:bg-neutral-800"
            onClick={onConfirm}
            disabled={processing || payoutAmount <= 0}
          >
            {processing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wallet className="h-4 w-4" />
            )}
            Mark {formatOrderTotal('GHS', payoutAmount)} as paid
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
