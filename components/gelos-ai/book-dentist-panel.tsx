'use client'

import {
  Calendar,
  CheckCircle2,
  Clock,
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
  validateAppointmentSlot,
} from '@/lib/gelos-ai/dentist-schedule'
import { dentistPartners } from '@/lib/gelos-ai/dentists'
import { trackSchedule } from '@/lib/meta-pixel'

const partnerDentist = dentistPartners[0]

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
    const nextDate = getNextClinicDate()
    setPreferredDate(nextDate)
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
      <p className="text-sm text-muted-foreground">
        No partner dentist is available right now. Please check back soon.
      </p>
    )
  }

  if (confirmation) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-[#84CC16]/30 bg-[#84CC16]/10 p-8 text-center">
        <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-[#5fa30d]" />
        <h3 className="text-xl font-semibold text-foreground">Booking request sent</h3>
        <p className="mt-2 text-sm text-muted-foreground">{confirmation.message}</p>
        <div className="mt-6 rounded-xl bg-white p-4 text-left text-sm">
          <p>
            <span className="font-medium">Reference:</span> {confirmation.reference}
          </p>
          <p className="mt-1">
            <span className="font-medium">Dentist:</span> {confirmation.dentist.name}
          </p>
          <p className="mt-1">
            <span className="font-medium">Clinic:</span> {confirmation.dentist.clinic}
          </p>
          <p className="mt-1">
            <span className="font-medium">Location:</span> {confirmation.dentist.address}
          </p>
          <p className="mt-1">
            <span className="font-medium">Phone:</span> {confirmation.dentist.phone}
          </p>
          <p className="mt-1">
            <span className="font-medium">Email:</span> {confirmation.dentist.email}
          </p>
        </div>
        <Button
          type="button"
          className="mt-6 rounded-full"
          variant="outline"
          onClick={() => setConfirmation(null)}
        >
          Book another appointment
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4F6CF7]/15 text-[#4F6CF7]">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Gelos partner clinic</h3>
            <p className="text-sm text-muted-foreground">
              Book a consultation with our trusted dental partner in Accra.
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          <div className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#4F6CF7]">
              {partnerDentist.clinic}
            </p>
            <p className="mt-1 text-xl font-semibold text-foreground">{partnerDentist.name}</p>
            <p className="text-sm text-muted-foreground">{partnerDentist.title}</p>

            <ul className="mt-5 space-y-3 text-sm text-foreground">
              <li className="flex items-start gap-2.5">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <span>
                  <span className="font-medium text-foreground">Opening hours</span>
                  <br />
                  <span className="text-muted-foreground">{CLINIC_HOURS_LABEL}</span>
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <span>
                  {partnerDentist.address}
                  <br />
                  <span className="text-muted-foreground">{partnerDentist.postalBox}</span>
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <span>
                  <span className="text-muted-foreground">T:</span> {partnerDentist.phone}
                  <br />
                  <span className="text-muted-foreground">M:</span> {partnerDentist.mobile}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <span>
                  {partnerDentist.emails.map((address) => (
                    <span key={address} className="block">
                      {address}
                    </span>
                  ))}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Globe className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <a
                  href={`https://${partnerDentist.website.replace(/^https?:\/\//, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#4F6CF7] hover:underline"
                >
                  {partnerDentist.website}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <form
        onSubmit={(e) => void onSubmit(e)}
        className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
      >
        <h3 className="mb-1 font-semibold text-foreground">Your appointment details</h3>
        <p className="mb-4 text-sm text-muted-foreground">{CLINIC_HOURS_LABEL}</p>

        <div className="space-y-4">
          <div>
            <Label htmlFor="booking-name">Full name</Label>
            <Input
              id="booking-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1.5 rounded-xl"
            />
          </div>
          <div>
            <Label htmlFor="booking-email">Email</Label>
            <Input
              id="booking-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1.5 rounded-xl"
            />
          </div>
          <div>
            <Label htmlFor="booking-phone">Phone</Label>
            <Input
              id="booking-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="mt-1.5 rounded-xl"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="booking-date">Preferred date</Label>
              <Input
                id="booking-date"
                type="date"
                value={preferredDate}
                onChange={(e) => onDateChange(e.target.value)}
                required
                min={new Date().toISOString().slice(0, 10)}
                className="mt-1.5 rounded-xl"
              />
              {dateError ? (
                <p className="mt-1.5 text-xs text-red-600">{dateError}</p>
              ) : (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Open Monday – Saturday only
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="booking-time">Preferred time</Label>
              <select
                id="booking-time"
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                required
                disabled={availableTimeSlots.length === 0}
                className="mt-1.5 flex h-9 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {availableTimeSlots.length === 0 ? (
                  <option value="">No slots available</option>
                ) : (
                  availableTimeSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))
                )}
              </select>
              <p className="mt-1.5 text-xs text-muted-foreground">
                30-minute slots, 8:00 AM – 7:00 PM
              </p>
            </div>
          </div>
          <div>
            <Label htmlFor="booking-reason">Reason for visit (optional)</Label>
            <Textarea
              id="booking-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Whitening consult, routine check-up, sensitivity…"
              className="mt-1.5 rounded-xl"
            />
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <Button
          type="submit"
          disabled={
            isSubmitting ||
            Boolean(dateError) ||
            !preferredTime ||
            availableTimeSlots.length === 0
          }
          className="mt-5 w-full rounded-full bg-neutral-950 text-white hover:bg-neutral-800"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Calendar className="h-4 w-4" />
          )}
          Request appointment
        </Button>
      </form>
    </div>
  )
}
