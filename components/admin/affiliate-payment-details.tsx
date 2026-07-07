'use client'

import { getAffiliatePayoutMethodLabel } from '@/lib/affiliate/payout'
import type { StoreAffiliate } from '@/lib/types/affiliate'
import { cn } from '@/lib/utils'

type AffiliatePaymentDetailsProps = {
  affiliate: Pick<
    StoreAffiliate,
    | 'payoutConfigured'
    | 'payoutMethod'
    | 'payoutAccountName'
    | 'payoutAccountNumber'
    | 'payoutProvider'
  >
  className?: string
}

export function AffiliatePaymentDetails({
  affiliate,
  className,
}: AffiliatePaymentDetailsProps) {
  if (!affiliate.payoutConfigured) {
    return (
      <div
        className={cn(
          'rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600',
          className,
        )}
      >
        No payment method on file yet.
      </div>
    )
  }

  return (
    <div
      className={cn(
        'grid gap-4 rounded-xl border border-neutral-200 p-4 sm:grid-cols-2',
        className,
      )}
    >
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          Method
        </p>
        <p className="mt-1 text-sm font-medium text-neutral-950">
          {getAffiliatePayoutMethodLabel(affiliate.payoutMethod)}
        </p>
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          Account holder
        </p>
        <p className="mt-1 text-sm font-medium text-neutral-950">
          {affiliate.payoutAccountName}
        </p>
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          {affiliate.payoutMethod === 'mobile_money' ? 'Network' : 'Bank'}
        </p>
        <p className="mt-1 text-sm text-neutral-950">{affiliate.payoutProvider}</p>
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          {affiliate.payoutMethod === 'mobile_money'
            ? 'Mobile money number'
            : 'Account number'}
        </p>
        <p className="mt-1 font-mono text-sm text-neutral-950">
          {affiliate.payoutAccountNumber}
        </p>
      </div>
    </div>
  )
}
