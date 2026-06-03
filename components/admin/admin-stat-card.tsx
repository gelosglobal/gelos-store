import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type AdminStatCardProps = {
  label: string
  value: string | number
  hint?: string
  icon: LucideIcon
  className?: string
}

export function AdminStatCard({
  label,
  value,
  hint,
  icon: Icon,
  className,
}: AdminStatCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-neutral-950">{value}</p>
          {hint && (
            <p className="mt-1 text-xs text-neutral-500">{hint}</p>
          )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}
