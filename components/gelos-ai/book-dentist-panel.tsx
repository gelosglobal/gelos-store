'use client'

import Image from 'next/image'
import {
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock,
  ExternalLink,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Stethoscope,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  CLINIC_HOURS_LABEL,
  getAvailableTimeSlotsForDate,
  getNextClinicDate,
  isClinicOpenDay,
  parseClinicDate,
  validateAppointmentSlot,
} from '@/lib/gelos-ai/dentist-schedule'
import { dentistPartners } from '@/lib/gelos-ai/dentists'
import { trackSchedule } from '@/lib/meta-pixel'
import { cn } from '@/lib/utils'

const partnerDentist = dentistPartners[0]
const CLINIC_IMAGE = '/gelos/dentist.png'

const REASON_SUGGESTIONS = [
  'Routine check-up',
  'Whitening consult',
  'Tooth sensitivity',
  'Gum care',
  'Kids dental visit',
] as const

type BookingConfirmation = {
  reference: string
  message: string
  dentist: {
    name: string
    clinic: string
    address: string
    phone: string
    email: string
  }
}

function formatAppointmentDate(dateValue: string): string {
  const date = parseClinicDate(dateValue)
  if (!date) return dateValue

  return date.toLocaleDateString('en-GH', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function getMapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address}, Accra, Ghana`)}`
}

export function BookDentistPanel() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [preferredDate, setPreferredDate] = useState('')
  const [preferredTime, setPreferredTime] = useState('')
  const [reason, setReason] = useState('')
  const [dateError, setDateError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null)

  const availableTimeSlots = useMemo(
    () => (preferredDate ? getAvailableTimeSlotsForDate(preferredDate) : []),
    [preferredDate],
  )

  useEffect(() => {
    setPreferredDate(getNextClinicDate())
  }, [])

  useEffect(() => {
    if (!preferredDate) return

    if (!isClinicOpenDay(preferredDate)) {
      setDateError('The clinic is closed on Sundays. Please choose Monday – Saturday.')
      return
    }

    setDateError(null)

    if (availableTimeSlots.length === 0) {
      setPreferredTime('')
      return
    }

    setPreferredTime((current) =>
      availableTimeSlots.includes(current) ? current : availableTimeSlots[0],
    )
  }, [preferredDate, availableTimeSlots])

  const onDateChange = (value: string) => {
    setPreferredDate(value)
    if (value && !isClinicOpenDay(value)) {
      setDateError('The clinic is closed on Sundays. Please choose Monday – Saturday.')
    } else {
      setDateError(null)
    }
  }

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!partnerDentist) return

    const slotCheck = validateAppointmentSlot(preferredDate, preferredTime)
    if (!slotCheck.valid) {
      setError(slotCheck.error)
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/gelos-ai/book-dentist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dentistId: partnerDentist.id,
          name,
          email,
          phone,
          preferredDate,
          preferredTime,
          reason: reason.trim() || undefined,
        }),
      })
      const data = (await res.json()) as BookingConfirmation & { error?: string }

      if (!res.ok) {
        throw new Error(data.error ?? 'Booking failed.')
      }

      trackSchedule(partnerDentist.clinic)
      setConfirmation(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!partnerDentist) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-8 text-center">
        <p className="text-sm text-neutral-600">
          No partner dentist is available right now. Please check back soon.
        </p>
      </div>
    )
  }

  if (confirmation) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="overflow-hidden rounded-[1.75rem] border border-[#BBF7D0] bg-[#F0FDF4] shadow-sm">
          <div className="border-b border-[#BBF7D0]/80 bg-white px-6 py-8 text-center sm:px-8">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#DCFCE7]">
              <CheckCircle2 className="size-7 text-[#15803D]" />
            </div>
            <h2 className="mt-4 text-2xl font-bold text-neutral-950">Request sent</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              {confirmation.message}
            </p>
          </div>

          <div className="space-y-4 p-6 sm:p-8">
            <div className="rounded-2xl border border-white/80 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                Your appointment
              </p>
              <p className="mt-2 text-lg font-bold text-neutral-950">
                {formatAppointmentDate(preferredDate)}
              </p>
              <p className="mt-1 text-sm font-medium text-[#15803D]">{preferredTime}</p>
            </div>

            <dl className="grid gap-3 text-sm text-neutral-700">
              <div className="flex justify-between gap-4 border-b border-[#BBF7D0]/60 pb-3">
                <dt className="text-neutral-500">Reference</dt>
                <dd className="font-semibold text-neutral-950">{confirmation.reference}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-[#BBF7D0]/60 pb-3">
                <dt className="text-neutral-500">Dentist</dt>
                <dd className="text-right font-medium">{confirmation.dentist.name}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-[#BBF7D0]/60 pb-3">
                <dt className="text-neutral-500">Clinic</dt>
                <dd className="text-right font-medium">{confirmation.dentist.clinic}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500">Location</dt>
                <dd className="text-right">{confirmation.dentist.address}</dd>
              </div>
            </dl>

            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href={`tel:${confirmation.dentist.phone.replace(/\s/g, '').split('/')[0]?.trim()}`}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-800 transition-colors hover:bg-neutral-50"
              >
                <Phone className="size-4" />
                Call clinic
              </a>
              <a
                href={getMapsUrl(confirmation.dentist.address)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#84CC16] px-4 py-3 text-sm font-semibold text-neutral-950 transition-colors hover:bg-[#73b512]"
              >
                <MapPin className="size-4" />
                Get directions
              </a>
            </div>
          </div>
        </div>

        <Button
          type="button"
          className="mt-6 w-full rounded-full"
          variant="outline"
          onClick={() => setConfirmation(null)}
        >
          Book another appointment
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-10">
      <aside className="space-y-4">
        <div className="overflow-hidden rounded-[1.75rem] border border-neutral-200 bg-white shadow-sm">
          <div className="relative h-36 bg-gradient-to-br from-[#F0FDF4] via-white to-[#F7FBFE] sm:h-40">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(132,204,22,0.12),transparent_55%)]" />
            <div className="absolute bottom-0 right-4 h-32 w-32 sm:right-6 sm:h-36 sm:w-36">
              <Image
                src={CLINIC_IMAGE}
                alt=""
                fill
                className="object-contain object-bottom"
                sizes="144px"
              />
            </div>
            <div className="relative flex h-full flex-col justify-end p-5 sm:p-6">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#15803D] shadow-sm backdrop-blur-sm">
                <Stethoscope className="size-3" />
                Gelos partner
              </span>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#65A30D]">
                {partnerDentist.clinic}
              </p>
              <h2 className="mt-1 text-2xl font-bold text-neutral-950">{partnerDentist.name}</h2>
              <p className="text-sm text-neutral-600">{partnerDentist.title}</p>
            </div>
          </div>

          <div className="space-y-4 border-t border-neutral-100 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#F0FDF4] text-[#65A30D]">
                <Clock className="size-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-neutral-950">Opening hours</p>
                <p className="mt-0.5 text-sm text-neutral-600">{CLINIC_HOURS_LABEL}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#F0FDF4] text-[#65A30D]">
                <MapPin className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-neutral-950">Location</p>
                <p className="mt-0.5 text-sm text-neutral-600">{partnerDentist.address}</p>
                <p className="text-sm text-neutral-500">{partnerDentist.postalBox}</p>
                <a
                  href={getMapsUrl(partnerDentist.address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#15803D] hover:underline"
                >
                  Open in Maps
                  <ExternalLink className="size-3.5" />
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#F0FDF4] text-[#65A30D]">
                <Phone className="size-4" />
              </span>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-neutral-500">Tel:</span>{' '}
                  <a
                    href={`tel:${partnerDentist.phone.replace(/\s/g, '').split('/')[0]?.trim()}`}
                    className="font-medium text-neutral-900 hover:underline"
                  >
                    {partnerDentist.phone}
                  </a>
                </p>
                <p>
                  <span className="text-neutral-500">Mobile:</span>{' '}
                  <a
                    href={`tel:${partnerDentist.mobile}`}
                    className="font-medium text-neutral-900 hover:underline"
                  >
                    {partnerDentist.mobile}
                  </a>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#F0FDF4] text-[#65A30D]">
                <Mail className="size-4" />
              </span>
              <div className="space-y-1 text-sm">
                {partnerDentist.emails.map((address) => (
                  <a
                    key={address}
                    href={`mailto:${address}`}
                    className="block font-medium text-neutral-900 hover:underline"
                  >
                    {address}
                  </a>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#F0FDF4] text-[#65A30D]">
                <Globe className="size-4" />
              </span>
              <a
                href={`https://${partnerDentist.website.replace(/^https?:\/\//, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-[#15803D] hover:underline"
              >
                {partnerDentist.website}
              </a>
            </div>
          </div>
        </div>
      </aside>

      <form
        onSubmit={(e) => void onSubmit(e)}
        className="rounded-[1.75rem] border border-neutral-200 bg-white p-5 shadow-sm sm:p-7"
      >
        <div className="mb-6">
          <h3 className="text-xl font-bold text-neutral-950">Request your appointment</h3>
          <p className="mt-1 text-sm text-neutral-600">
            Pick a date and time — we&apos;ll send your request to the clinic for confirmation.
          </p>
        </div>

        <div className="space-y-6">
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-neutral-950">When would you like to visit?</legend>

            <div>
              <Label htmlFor="booking-date" className="text-neutral-700">
                Preferred date
              </Label>
              <div className="relative mt-1.5">
                <CalendarDays className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400" />
                <Input
                  id="booking-date"
                  type="date"
                  value={preferredDate}
                  onChange={(e) => onDateChange(e.target.value)}
                  required
                  min={new Date().toISOString().slice(0, 10)}
                  className="rounded-xl pl-10"
                />
              </div>
              {dateError ? (
                <p className="mt-1.5 text-xs font-medium text-red-600">{dateError}</p>
              ) : (
                <p className="mt-1.5 text-xs text-neutral-500">Open Monday – Saturday only</p>
              )}
            </div>

            <div>
              <Label className="text-neutral-700">Preferred time</Label>
              {availableTimeSlots.length === 0 ? (
                <p className="mt-2 rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-6 text-center text-sm text-neutral-500">
                  No slots left for this date. Try another day.
                </p>
              ) : (
                <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {availableTimeSlots.map((slot) => {
                    const selected = preferredTime === slot
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setPreferredTime(slot)}
                        className={cn(
                          'rounded-xl border px-2 py-2.5 text-xs font-semibold transition-colors sm:text-sm',
                          selected
                            ? 'border-[#84CC16] bg-[#F0FDF4] text-[#15803D] shadow-sm'
                            : 'border-neutral-200 bg-white text-neutral-700 hover:border-[#BBF7D0] hover:bg-[#FAFFF5]',
                        )}
                      >
                        {slot}
                      </button>
                    )
                  })}
                </div>
              )}
              <p className="mt-2 text-xs text-neutral-500">30-minute slots, 8:00 AM – 7:00 PM</p>
            </div>
          </fieldset>

          <fieldset className="space-y-4 border-t border-neutral-100 pt-6">
            <legend className="text-sm font-semibold text-neutral-950">Your contact details</legend>

            <div>
              <Label htmlFor="booking-name">Full name</Label>
              <Input
                id="booking-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                placeholder="Your full name"
                className="mt-1.5 rounded-xl"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="booking-email">Email</Label>
                <Input
                  id="booking-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@email.com"
                  className="mt-1.5 rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="booking-phone">Phone</Label>
                <Input
                  id="booking-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  autoComplete="tel"
                  placeholder="e.g. 024 000 0000"
                  className="mt-1.5 rounded-xl"
                />
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-3 border-t border-neutral-100 pt-6">
            <legend className="text-sm font-semibold text-neutral-950">
              Reason for visit <span className="font-normal text-neutral-500">(optional)</span>
            </legend>

            <div className="flex flex-wrap gap-2">
              {REASON_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setReason(suggestion)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                    reason === suggestion
                      ? 'border-[#84CC16] bg-[#F0FDF4] text-[#15803D]'
                      : 'border-neutral-200 bg-neutral-50 text-neutral-600 hover:border-[#BBF7D0]',
                  )}
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <Textarea
              id="booking-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Anything else the clinic should know?"
              className="rounded-xl"
            />
          </fieldset>
        </div>

        {error ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          disabled={
            isSubmitting ||
            Boolean(dateError) ||
            !preferredTime ||
            availableTimeSlots.length === 0
          }
          className="mt-6 h-12 w-full rounded-full bg-[#84CC16] text-base font-semibold text-neutral-950 hover:bg-[#73b512]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Sending request…
            </>
          ) : (
            <>
              <Calendar className="size-4" />
              Request appointment
            </>
          )}
        </Button>

        <p className="mt-3 text-center text-xs leading-relaxed text-neutral-500">
          This sends a booking request — the clinic will confirm by email or phone.
        </p>
      </form>
    </div>
  )
}
