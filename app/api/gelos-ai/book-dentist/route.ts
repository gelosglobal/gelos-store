import { NextResponse } from 'next/server'
import { z } from 'zod'
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

    const reference = createBookingReference()

    console.info('[Gelos AI dentist booking]', {
      reference,
      dentist: dentist.name,
      ...parsed.data,
    })

    return NextResponse.json({
      reference,
      dentist: {
        name: dentist.name,
        specialty: dentist.specialty,
        location: dentist.location,
        area: dentist.area,
      },
      message: `Your request with ${dentist.name} has been received. The clinic will confirm your appointment by email or phone within 24 hours.`,
    })
  } catch (error) {
    console.error('[POST /api/gelos-ai/book-dentist]', error)
    return NextResponse.json(
      { error: 'Booking failed. Please try again.' },
      { status: 500 },
    )
  }
}
