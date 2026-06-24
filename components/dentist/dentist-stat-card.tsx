import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type DentistStatCardProps = {
  label: string
  value: string | number
  hint?: string
  icon: LucideIcon
  accent?: 'blue' | 'amber' | 'green' | 'neutral' | 'rose'
  className?: string
}

const accentStyles = {
  blue: 'bg-sky-50 text-sky-700',
  amber: 'bg-amber-50 text-amber-700',
  green: 'bg-emerald-50 text-emerald-700',
  neutral: 'bg-neutral-100 text-neutral-700',
  rose: 'bg-rose-50 text-rose-700',
}

export function DentistStatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = 'blue',
  className,
}: DentistStatCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-sky-100 bg-white p-4 shadow-sm',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-neutral-950">{value}</p>
          {hint ? <p className="mt-1 text-xs text-neutral-500">{hint}</p> : null}
        </div>
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl',
            accentStyles[accent],
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}
