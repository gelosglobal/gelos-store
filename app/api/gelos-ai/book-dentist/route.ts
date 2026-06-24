import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createDentistAppointment } from '@/lib/db/dentist-appointments'
import { notifyDentistNewAppointment } from '@/lib/email/send-dentist-appointment-email'
import { validateAppointmentSlot } from '@/lib/gelos-ai/dentist-schedule'
import { getDentistById } from '@/lib/gelos-ai/dentists'

export const dynamic = 'force-dynamic'

const bookingRequestSchema = z.object({
  dentistId: z.string().min(1),
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  phone: z.string().trim().min(6).max(30),
  preferredDate: z.string().trim().min(1),
  preferredTime: z.string().trim().min(1),
  reason: z.string().trim().max(500).optional(),
})

function createBookingReference(): string {
  const stamp = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `GEL-${stamp}-${rand}`
}

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const parsed = bookingRequestSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please complete all required booking fields.' },
        { status: 400 },
      )
    }

    const dentist = getDentistById(parsed.data.dentistId)
    if (!dentist) {
      return NextResponse.json({ error: 'Dentist not found.' }, { status: 404 })
    }

    const slotCheck = validateAppointmentSlot(
      parsed.data.preferredDate,
      parsed.data.preferredTime,
    )
    if (!slotCheck.valid) {
      return NextResponse.json({ error: slotCheck.error }, { status: 400 })
    }

    const reference = createBookingReference()

    const saved = await createDentistAppointment({
      appointmentId: reference,
      dentistId: dentist.id,
      patientName: parsed.data.name,
      patientEmail: parsed.data.email,
      patientPhone: parsed.data.phone,
      preferredDate: parsed.data.preferredDate,
      preferredTime: parsed.data.preferredTime,
      reason: parsed.data.reason,
    })

    if (saved.ok) {
      void notifyDentistNewAppointment(saved.appointment)
    } else {
      console.info('[Gelos AI dentist booking — no database]', {
        reference,
        dentist: dentist.name,
        ...parsed.data,
      })
    }

    return NextResponse.json({
      reference,
      dentist: {
        name: dentist.name,
        clinic: dentist.clinic,
        address: dentist.address,
        phone: dentist.phone,
        email: dentist.emails[0],
      },
      message: `Your request with ${dentist.clinic} has been received. The clinic will confirm your appointment by email or phone within 24 hours.`,
    })
  } catch (error) {
    console.error('[POST /api/gelos-ai/book-dentist]', error)
    return NextResponse.json(
      { error: 'Booking failed. Please try again.' },
      { status: 500 },
    )
  }
}
