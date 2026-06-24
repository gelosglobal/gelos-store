'use client'

import { Check, Circle, Clock3 } from 'lucide-react'
import type { OrderTimelineEvent } from '@/lib/types/order'
import { cn } from '@/lib/utils'

type OrderTimelineProps = {
  events: OrderTimelineEvent[]
}

function TimelineIcon({ status }: { status: OrderTimelineEvent['status'] }) {
  if (status === 'completed') {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
      </span>
    )
  }

  if (status === 'current') {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-sky-700 ring-2 ring-sky-200">
        <Clock3 className="h-3.5 w-3.5" strokeWidth={2.25} />
      </span>
    )
  }

  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
      <Circle className="h-3 w-3" strokeWidth={2.5} />
    </span>
  )
}

export function OrderTimeline({ events }: OrderTimelineProps) {
  if (events.length === 0) return null

  return (
    <ol className="space-y-0">
      {events.map((event, index) => {
        const isLast = index === events.length - 1

        return (
          <li key={event.id} className="relative flex gap-3 pb-6 last:pb-0">
            {!isLast ? (
              <span
                className={cn(
                  'absolute left-[13px] top-7 h-[calc(100%-12px)] w-px',
                  event.status === 'completed'
                    ? 'bg-emerald-200'
                    : 'bg-neutral-200',
                )}
                aria-hidden
              />
            ) : null}

            <div className="relative z-10 shrink-0">
              <TimelineIcon status={event.status} />
            </div>

            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p
                  className={cn(
                    'text-sm font-semibold',
                    event.status === 'upcoming'
                      ? 'text-neutral-400'
                      : 'text-neutral-950',
                  )}
                >
                  {event.title}
                </p>
                {event.timestampLabel ? (
                  <time
                    className="text-xs text-neutral-500"
                    dateTime={event.timestamp}
                    title={event.timestampFull}
                  >
                    {event.timestampLabel}
                  </time>
                ) : null}
              </div>
              {event.description ? (
                <p
                  className={cn(
                    'mt-1 text-sm leading-relaxed',
                    event.status === 'upcoming'
                      ? 'text-neutral-400'
                      : 'text-neutral-600',
                  )}
                >
                  {event.description}
                </p>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
