'use client'

import { Calendar, CheckCircle2, Loader2, MapPin, Star, Stethoscope } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { dentistPartners } from '@/lib/gelos-ai/dentists'
import { cn } from '@/lib/utils'

const TIME_SLOTS = [
  '9:00 AM',
  '11:00 AM',
  '1:00 PM',
  '3:00 PM',
  '5:00 PM',
] as const

type BookingConfirmation = {
  reference: string
  message: string
  dentist: {
    name: string
    specialty: string
    location: string
    area: string
  }
}

export function BookDentistPanel() {
  const [selectedDentistId, setSelectedDentistId] = useState(dentistPartners[0]?.id ?? '')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [preferredDate, setPreferredDate] = useState('')
  const [preferredTime, setPreferredTime] = useState(TIME_SLOTS[0])
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null)

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/gelos-ai/book-dentist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dentistId: selectedDentistId,
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

      setConfirmation(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed.')
    } finally {
      setIsSubmitting(false)
    }
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
            <span className="font-medium">Clinic:</span> {confirmation.dentist.location},{' '}
            {confirmation.dentist.area}
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
            <h3 className="font-semibold text-foreground">Choose a partner dentist</h3>
            <p className="text-sm text-muted-foreground">
              Gelos-trusted clinics across Accra — book a consultation in minutes.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {dentistPartners.map((dentist) => {
            const selected = selectedDentistId === dentist.id
            return (
              <button
                key={dentist.id}
                type="button"
                onClick={() => setSelectedDentistId(dentist.id)}
                className={cn(
                  'rounded-2xl border p-4 text-left transition-all',
                  selected
                    ? 'border-[#4F6CF7] bg-[#4F6CF7]/5 ring-1 ring-[#4F6CF7]/30'
                    : 'border-neutral-200 bg-white hover:border-neutral-300',
                )}
              >
                <p className="font-semibold text-foreground">{dentist.name}</p>
                <p className="text-xs text-muted-foreground">{dentist.title}</p>
                <p className="mt-1 text-sm text-foreground">{dentist.specialty}</p>
                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {dentist.location}, {dentist.area}
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1 font-medium text-foreground">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {dentist.rating} ({dentist.reviews})
                  </span>
                  <span className="text-muted-foreground">{dentist.nextAvailable}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <form
        onSubmit={(e) => void onSubmit(e)}
        className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
      >
        <h3 className="mb-4 font-semibold text-foreground">Your appointment details</h3>

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
                onChange={(e) => setPreferredDate(e.target.value)}
                required
                min={new Date().toISOString().slice(0, 10)}
                className="mt-1.5 rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="booking-time">Preferred time</Label>
              <select
                id="booking-time"
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                className="mt-1.5 flex h-9 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              >
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
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
          disabled={isSubmitting}
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
