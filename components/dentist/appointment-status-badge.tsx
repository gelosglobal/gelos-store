import type { AppointmentStatus } from '@/lib/dentist/appointment-types'
import { cn } from '@/lib/utils'

const styles: Record<AppointmentStatus, string> = {
  pending: 'bg-amber-50 text-amber-900 ring-1 ring-amber-200/80',
  confirmed: 'bg-blue-50 text-blue-800 ring-1 ring-blue-200/80',
  completed: 'bg-green-50 text-green-800 ring-1 ring-green-200/80',
  cancelled: 'bg-neutral-100 text-neutral-600 ring-1 ring-neutral-200',
}

const dotStyles: Record<AppointmentStatus, string> = {
  pending: 'bg-amber-600',
  confirmed: 'bg-blue-600',
  completed: 'bg-green-600',
  cancelled: 'bg-neutral-400',
}

const labels: Record<AppointmentStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
        styles[status],
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', dotStyles[status])} />
      {labels[status]}
    </span>
  )
}
