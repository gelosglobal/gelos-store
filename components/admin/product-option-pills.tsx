'use client'

import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ProductOptionPill = {
  id: string
  label: string
  badge?: string
  active?: boolean
}

type ProductOptionPillsProps = {
  options: ProductOptionPill[]
  onToggle?: (id: string) => void
  expanded?: boolean
  onExpandToggle?: () => void
  children?: React.ReactNode
}

export function ProductOptionPills({
  options,
  onToggle,
  expanded,
  onExpandToggle,
  children,
}: ProductOptionPillsProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onToggle?.(opt.id)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors',
              opt.active
                ? 'border-neutral-300 bg-neutral-100 text-neutral-900'
                : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300',
            )}
          >
            {opt.label}
            {opt.badge && (
              <span className="rounded bg-neutral-200 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-600">
                {opt.badge}
              </span>
            )}
          </button>
        ))}
        {onExpandToggle && (
          <button
            type="button"
            onClick={onExpandToggle}
            className="ml-auto inline-flex rounded-lg p-1 text-neutral-500 hover:bg-neutral-100"
            aria-label="Toggle more options"
          >
            <ChevronDown
              className={cn(
                'h-4 w-4 transition-transform',
                expanded && 'rotate-180',
              )}
            />
          </button>
        )}
      </div>
      {expanded && children ? (
        <div className="space-y-3 border-t border-neutral-100 pt-3">
          {children}
        </div>
      ) : null}
    </div>
  )
}
