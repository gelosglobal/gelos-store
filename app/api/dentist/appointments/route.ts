import { NextResponse } from 'next/server'
import { isAppointmentStatus } from '@/lib/dentist/appointment-types'
import { isDentistSessionValid } from '@/lib/dentist/auth'
import {
  getDentistAppointmentStats,
  listDentistAppointments,
} from '@/lib/db/dentist-appointments'
import { dentistPartners } from '@/lib/gelos-ai/dentists'

export const dynamic = 'force-dynamic'

const partnerDentist = dentistPartners[0]

export async function GET(request: Request) {
  if (!(await isDentistSessionValid())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!partnerDentist) {
    return NextResponse.json({ error: 'No partner dentist configured.' }, { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const statusParam = searchParams.get('status')
  const status =
    statusParam && isAppointmentStatus(statusParam) ? statusParam : undefined

  const [appointments, stats] = await Promise.all([
    listDentistAppointments(partnerDentist.id, status),
    getDentistAppointmentStats(partnerDentist.id),
  ])

  return NextResponse.json({
    dentist: {
      id: partnerDentist.id,
      name: partnerDentist.name,
      clinic: partnerDentist.clinic,
    },
    appointments,
    stats,
  })
}
