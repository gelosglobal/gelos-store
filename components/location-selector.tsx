'use client'

import { useRouter } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useLocation } from '@/components/location-provider'
import { locations, type LocationId } from '@/lib/locations'
import { cn } from '@/lib/utils'

type LocationSelectorProps = {
  className?: string
  /** Use full country names in the trigger (mobile sheet) */
  showFullLabel?: boolean
}

export function LocationSelector({
  className,
  showFullLabel = false,
}: LocationSelectorProps) {
  const router = useRouter()
  const { locationId, setLocationId, isHydrated, location } = useLocation()

  if (!isHydrated) {
    return (
      <div
        className={cn(
          'flex h-9 min-w-[7.5rem] items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3',
          className,
        )}
        aria-hidden
      >
        <span className="h-4 w-5 animate-pulse rounded bg-neutral-200" />
        <span className="h-3 w-16 animate-pulse rounded bg-neutral-200" />
      </div>
    )
  }

  return (
    <Select
      value={locationId}
      onValueChange={(value) => {
        const next = value as LocationId
        setLocationId(next)
        if (next === 'usa') {
          router.push('/us')
        }
      }}
    >
      <SelectTrigger
        className={cn(
          'font-nav h-9 gap-1.5 rounded-full border-neutral-200 bg-white px-2.5 shadow-none sm:px-3',
          'text-xs font-medium text-neutral-800 hover:bg-neutral-100 hover:text-neutral-950',
          'focus:ring-neutral-950/20 focus-visible:border-neutral-950 [&>svg]:opacity-60',
          showFullLabel ? 'w-full max-w-none' : 'max-w-[10.5rem] sm:max-w-[11.5rem]',
          className,
        )}
        aria-label="Select shopping region"
      >
        <SelectValue>
          <span className="flex items-center gap-1.5 truncate">
            <span aria-hidden>{location.flag}</span>
            <span className="truncate">
              {showFullLabel ? location.label : location.shortLabel}
            </span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="end" className="font-nav min-w-[12rem]">
        {locations.map((loc) => (
          <SelectItem key={loc.id} value={loc.id} className="py-2.5">
            <span className="flex items-center gap-2.5">
              <span className="text-base leading-none" aria-hidden>
                {loc.flag}
              </span>
              <span className="flex flex-col items-start gap-0.5">
                <span className="font-medium text-neutral-950">{loc.label}</span>
                <span className="text-xs text-neutral-500">
                  {loc.currencyCode} · {loc.currency}
                </span>
              </span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
