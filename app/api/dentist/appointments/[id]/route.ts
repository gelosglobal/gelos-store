import { NextResponse } from 'next/server'
import { z } from 'zod'
import { isAppointmentStatus } from '@/lib/dentist/appointment-types'
import { isDentistSessionValid } from '@/lib/dentist/auth'
import { updateDentistAppointment } from '@/lib/db/dentist-appointments'
import { dentistPartners } from '@/lib/gelos-ai/dentists'

export const dynamic = 'force-dynamic'

const partnerDentist = dentistPartners[0]

const updateSchema = z.object({
  status: z.string().optional(),
  dentistNotes: z.string().max(1000).optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isDentistSessionValid())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!partnerDentist) {
    return NextResponse.json({ error: 'No partner dentist configured.' }, { status: 404 })
  }

  const { id } = await params
  const json = await request.json()
  const parsed = updateSchema.safeParse(json)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid update payload.' }, { status: 400 })
  }

  if (parsed.data.status && !isAppointmentStatus(parsed.data.status)) {
    return NextResponse.json({ error: 'Invalid status.' }, { status: 400 })
  }

  const appointment = await updateDentistAppointment({
    appointmentId: id,
    dentistId: partnerDentist.id,
    status: parsed.data.status as
      | 'pending'
      | 'confirmed'
      | 'completed'
      | 'cancelled'
      | undefined,
    dentistNotes: parsed.data.dentistNotes,
  })

  if (!appointment) {
    return NextResponse.json({ error: 'Appointment not found.' }, { status: 404 })
  }

  return NextResponse.json({ appointment })
}
