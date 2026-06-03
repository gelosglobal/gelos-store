import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type ProductFormCardProps = {
  children: ReactNode
  className?: string
}

export function ProductFormCard({ children, className }: ProductFormCardProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm',
        className,
      )}
    >
      {children}
    </div>
  )
}

type ProductFormCardHeaderProps = {
  title: string
  action?: ReactNode
  className?: string
}

export function ProductFormCardHeader({
  title,
  action,
  className,
}: ProductFormCardHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3.5 sm:px-5',
        className,
      )}
    >
      <h2 className="text-sm font-semibold text-neutral-950">{title}</h2>
      {action}
    </div>
  )
}

export function ProductFormCardBody({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-4 px-4 py-4 sm:px-5 sm:py-5', className)}>
      {children}
    </div>
  )
}
