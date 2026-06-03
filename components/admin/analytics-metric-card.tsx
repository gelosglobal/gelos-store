import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type AnalyticsMetricCardProps = {
  title: string
  value: string
  change?: { label: string; positive?: boolean }
  className?: string
  children?: ReactNode
}

export function AnalyticsMetricCard({
  title,
  value,
  change,
  className,
  children,
}: AnalyticsMetricCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5',
        className,
      )}
    >
      <div className="mb-3">
        <p className="text-sm font-medium text-neutral-600">{title}</p>
        <div className="mt-1 flex flex-wrap items-baseline gap-2">
          <p className="text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
            {value}
          </p>
          {change && (
            <span
              className={cn(
                'text-xs font-semibold',
                change.positive !== false
                  ? 'text-green-700'
                  : 'text-red-600',
              )}
            >
              {change.label}
            </span>
          )}
        </div>
      </div>
      {children ? <div className="min-h-0 flex-1">{children}</div> : null}
    </div>
  )
}
