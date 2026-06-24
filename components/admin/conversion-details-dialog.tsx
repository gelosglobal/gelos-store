'use client'

import { CalendarCheck, Eye, Repeat2 } from 'lucide-react'
import type { OrderConversionDetails } from '@/lib/types/order'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'

type ConversionDetailsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  details: OrderConversionDetails
}

function TimelineRow({
  icon,
  title,
  meta,
  subtitle,
  action,
}: {
  icon: React.ReactNode
  title: string
  meta: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 py-4">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-neutral-600">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-neutral-950">{title}</p>
        <p className="mt-1 text-sm text-neutral-500">{meta}</p>
        {subtitle ? (
          <p className="mt-0.5 text-xs text-neutral-400">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

export function ConversionDetailsDialog({
  open,
  onOpenChange,
  details,
}: ConversionDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-xl" showCloseButton>
        <DialogHeader className="border-b border-neutral-200 px-6 py-4">
          <DialogTitle className="text-base font-semibold text-neutral-950">
            Conversion details
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-5">
          <div className="grid grid-cols-2 gap-4 rounded-xl border border-neutral-200 bg-neutral-50/80 p-4">
            <div>
              <p className="text-sm text-neutral-500">Total sessions</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight text-neutral-950">
                {details.totalSessions}
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-500">Days to conversion</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight text-neutral-950">
                {details.daysToConversion}
              </p>
            </div>
          </div>

          <div className="mt-2 divide-y divide-neutral-200">
            <TimelineRow
              icon={<Eye className="h-4 w-4" />}
              title={details.firstSessionTitle}
              meta={details.firstSessionDate}
              action={
                <Button type="button" variant="outline" size="sm" className="h-8">
                  View full sessions
                </Button>
              }
            />

            {details.returnCount > 0 ? (
              <TimelineRow
                icon={<Repeat2 className="h-4 w-4" />}
                title={`Returned ${details.returnCount} ${details.returnCount === 1 ? 'time' : 'times'}`}
                meta={details.returnPeriodLabel}
              />
            ) : null}

            <TimelineRow
              icon={<CalendarCheck className="h-4 w-4" />}
              title={details.conversionTitle}
              meta={details.conversionDate}
              subtitle={details.conversionVia}
              action={
                <Button type="button" variant="outline" size="sm" className="h-8">
                  View full session
                </Button>
              }
            />
          </div>
        </div>

        <Separator />

        <DialogFooter className="px-6 py-4 sm:justify-end">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
