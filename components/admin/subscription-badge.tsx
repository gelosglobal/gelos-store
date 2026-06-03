import type { EmailSubscription } from '@/lib/types/customer'
import { cn } from '@/lib/utils'

const styles: Record<EmailSubscription, string> = {
  Subscribed: 'bg-green-50 text-green-800 ring-1 ring-green-200/80',
  'Not subscribed': 'bg-neutral-100 text-neutral-600 ring-1 ring-neutral-200/80',
}

export function SubscriptionBadge({
  status,
}: {
  status: EmailSubscription
}) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
        styles[status],
      )}
    >
      {status}
    </span>
  )
}
