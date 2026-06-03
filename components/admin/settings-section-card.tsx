import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type SettingsSectionCardProps = {
  title: string
  description?: string
  icon?: LucideIcon
  className?: string
  children: ReactNode
  footer?: ReactNode
}

export function SettingsSectionCard({
  title,
  description,
  icon: Icon,
  className,
  children,
  footer,
}: SettingsSectionCardProps) {
  return (
    <section
      className={cn(
        'rounded-xl border border-neutral-200 bg-white shadow-sm',
        className,
      )}
    >
      <div className="border-b border-neutral-100 px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3">
          {Icon && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
              <Icon className="h-4 w-4 text-neutral-700" />
            </div>
          )}
          <div>
            <h2 className="text-base font-semibold text-neutral-950">{title}</h2>
            {description && (
              <p className="mt-0.5 text-sm text-neutral-500">{description}</p>
            )}
          </div>
        </div>
      </div>
      <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">{children}</div>
      {footer ? (
        <div className="border-t border-neutral-100 px-4 py-3 sm:px-5">
          {footer}
        </div>
      ) : null}
    </section>
  )
}
