import type { FulfillmentStatus, PaymentStatus } from '@/lib/types/order'
import { cn } from '@/lib/utils'

const paymentStyles: Record<PaymentStatus, string> = {
  Paid: 'bg-neutral-100 text-neutral-700',
  'Payment pending': 'bg-amber-50 text-amber-800 ring-1 ring-amber-200/80',
}

const fulfillmentStyles: Record<string, string> = {
  Unfulfilled: 'bg-amber-50 text-amber-900 ring-1 ring-amber-200/80',
  Fulfilled: 'bg-green-50 text-green-800 ring-1 ring-green-200/80',
  Processing: 'bg-blue-50 text-blue-800 ring-1 ring-blue-200/80',
  Shipped: 'bg-blue-50 text-blue-800 ring-1 ring-blue-200/80',
  Delivered: 'bg-green-50 text-green-800 ring-1 ring-green-200/80',
}

function Dot({ className }: { className?: string }) {
  return (
    <span
      className={cn('inline-block h-1.5 w-1.5 shrink-0 rounded-full', className)}
      aria-hidden
    />
  )
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        paymentStyles[status],
      )}
    >
      <Dot
        className={
          status === 'Paid' ? 'bg-neutral-500' : 'bg-amber-600'
        }
      />
      {status}
    </span>
  )
}

export function FulfillmentStatusBadge({
  status,
}: {
  status: FulfillmentStatus
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        fulfillmentStyles[status] ?? fulfillmentStyles.Unfulfilled,
      )}
    >
      <Dot className="bg-amber-600" />
      {status}
    </span>
  )
}
