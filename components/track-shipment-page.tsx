'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  Handshake,
  Loader2,
  MapPin,
  Package,
  Plane,
  Search,
  ShoppingBag,
  Star,
  Truck,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { TrackResultsSkeleton } from '@/components/track-results-skeleton'
import {
  CUSTOMER_TIMELINE_STEPS,
  normalizeDhlTrackingNumber,
} from '@/lib/dhl/checkpoints'
import type {
  PublicTrackingEventView,
  PublicTrackingView,
} from '@/lib/dhl/public-tracking'
import { cn } from '@/lib/utils'

type TrackShipmentPageProps = {
  initialNumber?: string
  initialTracking?: PublicTrackingView | null
  initialError?: string | null
  initialRated?: boolean
}

const TIMELINE_ICONS: Record<string, LucideIcon> = {
  pickup: ShoppingBag,
  depart: Plane,
  arrived: MapPin,
  delivery: Truck,
}

const EXCEPTION_CODES = new Set([
  'BA',
  'ND',
  'NH',
  'OH',
  'HP',
  'DD',
  'RD',
  'RT',
])

type TimelineStatus = 'idle' | 'progress' | 'delivered' | 'issue'

type TimelineStepView = {
  id: string
  label: string
  description: string
  time?: string
  Icon: LucideIcon
  done: boolean
  current: boolean
}

function compactEventTime(event?: PublicTrackingEventView) {
  if (!event?.at) return event?.atLabel
  const parsed = Date.parse(event.at)
  if (!Number.isFinite(parsed)) return event.atLabel
  return new Date(parsed).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function buildTimeline(tracking?: PublicTrackingView | null): {
  status: TimelineStatus
  steps: TimelineStepView[]
  exception: PublicTrackingEventView | null
} {
  const events = tracking?.events ?? []
  const latest = events.at(-1)
  const exception =
    latest && EXCEPTION_CODES.has(latest.code) ? latest : null
  const reached = CUSTOMER_TIMELINE_STEPS.map((step) =>
    events.findLast((event) =>
      (step.codes as readonly string[]).includes(event.code),
    ),
  )
  const lastDone = reached.findLastIndex(Boolean)
  const delivered = Boolean(tracking?.delivered)

  const steps = CUSTOMER_TIMELINE_STEPS.map((step, index) => {
    const event = reached[index]
    const done = delivered
      ? true
      : lastDone >= 0
        ? index <= lastDone
        : false
    const current =
      !delivered &&
      lastDone >= 0 &&
      index === lastDone &&
      !EXCEPTION_CODES.has(latest?.code ?? '')
    const deliveredStep =
      'deliveredLabel' in step && delivered ? step.deliveredLabel : step.label
    return {
      id: step.id,
      // Prefer the specific DHL major label for this scan when available.
      label:
        delivered && step.id === 'delivery'
          ? deliveredStep
          : event?.label || step.label,
      // Prefer DHL API description, then service area, then our fallback.
      description: event?.description || event?.location || step.fallback,
      time: compactEventTime(event),
      Icon: TIMELINE_ICONS[step.id] ?? Package,
      done,
      current,
    }
  })

  const status: TimelineStatus = !tracking
    ? 'idle'
    : exception
      ? 'issue'
      : delivered
        ? 'delivered'
        : lastDone >= 0
          ? 'progress'
          : 'idle'

  return { status, steps, exception }
}

export function TrackShipmentPage({
  initialNumber = '',
  initialTracking = null,
  initialError = null,
  initialRated = false,
}: TrackShipmentPageProps) {
  const [value, setValue] = useState(initialNumber)
  const [formError, setFormError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [pending, setPending] = useState(false)
  const tracking = initialTracking
  const error = initialError
  const hasResult = Boolean(tracking || error)

  function submit(event: React.FormEvent<HTMLFormElement>) {
    const next = normalizeDhlTrackingNumber(value)
    if (!next) {
      event.preventDefault()
      setFormError('Enter a valid DHL tracking number (8–39 letters or digits).')
      return
    }
    setFormError(null)
    setPending(true)
  }

  async function copyNumber(number: string) {
    try {
      await navigator.clipboard.writeText(number)
      setCopied(true)
      toast.success('Tracking number copied')
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      toast.error('Could not copy tracking number')
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-foreground">
      <section className="relative overflow-hidden border-b border-neutral-200 bg-[radial-gradient(ellipse_at_top,#f7fbfe_0%,#ffffff_100%)] pb-16">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-sky-100/70 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-emerald-50/80 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-4 pt-8 sm:px-6 sm:pt-10 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">
            Shipping
          </p>
          <h1 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">
            Track your order
          </h1>
          <p className="mt-3 max-w-xl text-sm text-neutral-600 sm:text-base">
            Enter the DHL tracking number from your shipping email.
          </p>
        </div>
      </section>

      <div className="relative z-10 mx-auto max-w-5xl px-4 pb-24 sm:px-6 sm:pb-16 lg:px-8">
        <form
          action="/track"
          method="get"
          onSubmit={submit}
          className="-mt-12 rounded-2xl border border-neutral-200 bg-white p-3 shadow-lg shadow-neutral-900/5 sm:p-4"
        >
          <label htmlFor="track-number" className="sr-only">
            DHL tracking number
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                id="track-number"
                name="number"
                value={value}
                onChange={(event) => {
                  setValue(event.target.value)
                  if (formError) setFormError(null)
                }}
                placeholder="e.g. 1234567890"
                autoComplete="off"
                spellCheck={false}
                inputMode="text"
                required
                minLength={8}
                maxLength={39}
                className="h-12 border-0 bg-neutral-50 pl-10 font-mono text-base shadow-none focus-visible:ring-sky-500/30 sm:bg-transparent"
                aria-invalid={Boolean(formError)}
                aria-describedby={
                  formError ? 'track-number-error' : 'track-number-hint'
                }
              />
            </div>
            <Button
              type="submit"
              disabled={pending}
              className="h-12 px-7 sm:min-w-[8.5rem]"
            >
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Looking up
                </>
              ) : (
                'Track'
              )}
            </Button>
          </div>
          {formError || error ? (
            <div className="mt-3 rounded-xl bg-amber-50 px-3 py-3">
              <p
                id="track-number-error"
                className="text-sm font-medium text-amber-950"
              >
                {formError || error}
              </p>
              {error ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm" className="bg-white">
                    <a href="/track">Try another number</a>
                  </Button>
                  <Button asChild variant="secondary" size="sm">
                    <a href="/contact">Contact support</a>
                  </Button>
                </div>
              ) : null}
            </div>
          ) : (
            <p id="track-number-hint" className="sr-only">
              Enter your DHL tracking number
            </p>
          )}
        </form>

        <div className="mt-8">
          {pending && hasResult ? (
            <TrackResultsSkeleton />
          ) : tracking ? (
            <ShipmentTimelineCard
              tracking={tracking}
              copied={copied}
              initialRated={initialRated}
              onCopy={() => copyNumber(tracking.trackingNumber)}
            />
          ) : error ? null : (
            <EmptyState />
          )}
        </div>

        <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-bold text-neutral-950">Need help?</h2>
          <p className="mt-2 max-w-xl text-sm text-neutral-600">
            Contact us with your order number if tracking has not updated.
          </p>
          <Link
            href="/contact"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-950 underline-offset-4 hover:underline"
          >
            Contact Gelos support
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}

function ShipmentTimelineCard({
  tracking,
  copied,
  initialRated,
  onCopy,
}: {
  tracking: PublicTrackingView
  copied: boolean
  initialRated: boolean
  onCopy: () => void
}) {
  const { status, steps, exception } = buildTimeline(tracking)
  return (
    <div className="mx-auto w-full max-w-[420px]">
      <TimelineCard
        status={status}
        steps={steps}
        exception={exception}
        trackingNumber={tracking.trackingNumber}
        delivered={tracking.delivered}
        initialRated={initialRated}
      />
      <div className="mt-4 flex items-center justify-center gap-3 text-xs text-neutral-500">
        <span className="font-mono tracking-wide text-neutral-700">
          {tracking.trackingNumber}
        </span>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium hover:bg-neutral-100 hover:text-neutral-800"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-600" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {copied ? 'Copied' : 'Copy'}
        </button>
        <a
          href={tracking.dhlTrackingUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 font-medium text-sky-700 hover:text-sky-900"
        >
          DHL.com
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  )
}

function TimelineCard({
  status,
  steps,
  exception = null,
  trackingNumber,
  delivered = false,
  initialRated = false,
}: {
  status: TimelineStatus
  steps: TimelineStepView[]
  exception?: PublicTrackingEventView | null
  trackingNumber?: string
  delivered?: boolean
  initialRated?: boolean
}) {
  const statusPill =
    status === 'delivered'
      ? {
          label: 'Delivered',
          className: 'bg-emerald-50 text-emerald-700',
          iconClassName: 'text-emerald-500',
        }
      : status === 'issue'
        ? {
            label: 'Needs attention',
            className: 'bg-amber-50 text-amber-800',
            iconClassName: 'text-amber-500',
          }
        : status === 'progress'
          ? {
              label: 'In Progress',
              className: 'bg-sky-50 text-sky-600',
              iconClassName: 'text-sky-400',
            }
          : {
              label: 'Awaiting',
              className: 'bg-neutral-100 text-neutral-500',
              iconClassName: 'text-neutral-400',
            }

  return (
    <article className="rounded-[28px] bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)] ring-1 ring-black/[0.04] sm:p-7">
      <header className="flex items-center gap-3">
        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-500">
          Timeline
        </span>
        <span
          className="h-px min-w-6 flex-1 border-t border-dashed border-neutral-200"
          aria-hidden
        />
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
            statusPill.className,
          )}
        >
          <Check className={cn('h-3.5 w-3.5', statusPill.iconClassName)} />
          {statusPill.label}
        </span>
      </header>

      <ol className="mt-8">
        {steps.map((step, index) => {
          const last = index === steps.length - 1
          const Icon = step.Icon
          return (
            <li
              key={step.id}
              className="grid grid-cols-[44px_minmax(0,1fr)_auto] gap-x-3"
            >
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    'flex h-11 w-11 items-center justify-center rounded-full border',
                    step.done
                      ? 'border-solid border-neutral-400 text-neutral-700'
                      : 'border-dashed border-neutral-300 text-neutral-300',
                    step.current
                      ? 'border-sky-500 bg-sky-50 text-sky-700'
                      : null,
                    status === 'delivered' && step.done
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : null,
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.6} />
                </span>
                {last ? null : (
                  <span
                    className={cn(
                      'my-1 w-px flex-1',
                      step.done ? 'bg-neutral-300' : 'bg-neutral-200',
                    )}
                    aria-hidden
                  />
                )}
              </div>
              <div className={cn('min-w-0', last ? 'pb-0' : 'pb-6')}>
                <p
                  className={cn(
                    'text-[15px] font-bold leading-6',
                    step.done || step.current
                      ? 'text-neutral-950'
                      : 'text-neutral-400',
                  )}
                >
                  {step.label}
                </p>
                <p
                  className={cn(
                    'mt-0.5 text-[13px] leading-5',
                    step.done || step.current
                      ? 'text-neutral-400'
                      : 'text-neutral-300',
                  )}
                >
                  {step.description}
                </p>
              </div>
              <p
                className={cn(
                  'min-w-[4.75rem] pt-0.5 text-right text-[12px] tabular-nums text-neutral-400',
                  step.time ? null : 'invisible',
                )}
              >
                {step.time ?? '—'}
              </p>
            </li>
          )
        })}
      </ol>

      {exception ? (
        <div className="mt-5 flex items-start gap-2 rounded-2xl bg-amber-50 px-3 py-3 text-sm text-amber-950">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
          <p>
            <span className="font-semibold">{exception.label}.</span>{' '}
            DHL could not complete this step. Contact us if you need help.
          </p>
        </div>
      ) : null}

      {delivered && trackingNumber ? (
        <RateDeliveryAction
          trackingNumber={trackingNumber}
          initialRated={initialRated}
        />
      ) : null}
    </article>
  )
}

function RateDeliveryAction({
  trackingNumber,
  initialRated,
}: {
  trackingNumber: string
  initialRated: boolean
}) {
  const [open, setOpen] = useState(false)
  const [rated, setRated] = useState(initialRated)
  const [stars, setStars] = useState(5)
  const [hover, setHover] = useState(0)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (initialRated) {
      setRated(true)
      return
    }
    let cancelled = false
    void fetch(
      `/api/store/delivery-rating?number=${encodeURIComponent(trackingNumber)}`,
    )
      .then((res) => res.json())
      .then((data: { rating?: { ratingId?: string } | null }) => {
        if (!cancelled && data.rating?.ratingId) setRated(true)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [trackingNumber, initialRated])

  async function submitRating(event: React.FormEvent) {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    try {
      const res = await fetch('/api/store/delivery-rating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackingNumber,
          rating: stars,
          comment: comment.trim() || undefined,
          customerName: name.trim() || undefined,
          customerEmail: email.trim() || undefined,
        }),
      })
      const data = (await res.json()) as { error?: string; ok?: boolean }
      if (!res.ok) throw new Error(data.error ?? 'Could not save rating')
      setRated(true)
      setOpen(false)
      toast.success('Thanks for rating this delivery')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save rating')
    } finally {
      setSaving(false)
    }
  }

  if (rated) {
    return (
      <div className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-emerald-50 text-sm font-semibold text-emerald-800">
        <Check className="h-4 w-4" />
        Thanks for your feedback
      </div>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-emerald-50 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
      >
        <Handshake className="h-4 w-4" strokeWidth={1.8} />
        Rate this delivery
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rate this delivery</DialogTitle>
            <DialogDescription>
              How was your DHL Express experience for tracking{' '}
              <span className="font-mono">{trackingNumber}</span>?
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submitRating} className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium text-neutral-950">
                Your rating
              </p>
              <div
                className="flex items-center gap-1"
                onMouseLeave={() => setHover(0)}
              >
                {Array.from({ length: 5 }).map((_, index) => {
                  const value = index + 1
                  const active = (hover || stars) >= value
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-label={`${value} star${value === 1 ? '' : 's'}`}
                      onMouseEnter={() => setHover(value)}
                      onClick={() => setStars(value)}
                      className="rounded-md p-1 transition-colors hover:bg-neutral-50"
                    >
                      <Star
                        className={cn(
                          'h-7 w-7',
                          active
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-neutral-300',
                        )}
                      />
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="rate-name">Name (optional)</Label>
                <Input
                  id="rate-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={120}
                  autoComplete="name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rate-email">Email (optional)</Label>
                <Input
                  id="rate-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  maxLength={200}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rate-comment">Comment (optional)</Label>
              <Textarea
                id="rate-comment"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                maxLength={1000}
                placeholder="What went well, or what we can improve?"
                className="min-h-24"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving
                  </>
                ) : (
                  'Submit rating'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

function EmptyState() {
  const { status, steps } = buildTimeline(null)

  return (
    <div className="mx-auto w-full max-w-[420px]">
      <TimelineCard status={status} steps={steps} />
    </div>
  )
}
