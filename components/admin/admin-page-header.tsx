import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type AdminPageHeaderProps = {
  title: string
  description?: string
  children?: ReactNode
  className?: string
}

export function AdminPageHeader({
  title,
  description,
  children,
  className,
}: AdminPageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between',
        className,
      )}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-neutral-500 sm:text-base">
            {description}
          </p>
        )}
      </div>
      {children ? <div className="flex shrink-0 items-center gap-2">{children}</div> : null}
    </div>
  )
}
