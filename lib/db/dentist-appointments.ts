import type {
  AppointmentStatus,
  DentistAppointmentRecord,
  DentistAppointmentStats,
} from '@/lib/dentist/appointment-types'
import { isAppointmentStatus } from '@/lib/dentist/appointment-types'
import { isDatabaseConfigured } from '@/lib/env'
import { prisma } from '@/lib/prisma'

function mapAppointment(row: {
  id: string
  appointmentId: string
  dentistId: string
  patientName: string
  patientEmail: string
  patientPhone: string
  preferredDate: string
  preferredTime: string
  reason: string
  status: string
  dentistNotes: string
  createdAt: Date
  updatedAt: Date
}): DentistAppointmentRecord {
  return {
    id: row.id,
    appointmentId: row.appointmentId,
    dentistId: row.dentistId,
    patientName: row.patientName,
    patientEmail: row.patientEmail,
    patientPhone: row.patientPhone,
    preferredDate: row.preferredDate,
    preferredTime: row.preferredTime,
    reason: row.reason,
    status: isAppointmentStatus(row.status) ? row.status : 'pending',
    dentistNotes: row.dentistNotes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export async function createDentistAppointment(input: {
  appointmentId: string
  dentistId: string
  patientName: string
  patientEmail: string
  patientPhone: string
  preferredDate: string
  preferredTime: string
  reason?: string
}): Promise<{ ok: true; appointment: DentistAppointmentRecord } | { ok: false; reason: 'no_database' }> {
  if (!isDatabaseConfigured()) {
    return { ok: false, reason: 'no_database' }
  }

  const row = await prisma.dentistAppointment.create({
    data: {
      appointmentId: input.appointmentId,
      dentistId: input.dentistId,
      patientName: input.patientName,
      patientEmail: input.patientEmail,
      patientPhone: input.patientPhone,
      preferredDate: input.preferredDate,
      preferredTime: input.preferredTime,
      reason: input.reason?.trim() ?? '',
      status: 'pending',
    },
  })

  return { ok: true, appointment: mapAppointment(row) }
}

export async function listDentistAppointments(
  dentistId: string,
  status?: AppointmentStatus,
): Promise<DentistAppointmentRecord[]> {
  if (!isDatabaseConfigured()) return []

  const rows = await prisma.dentistAppointment.findMany({
    where: {
      dentistId,
      ...(status ? { status } : {}),
    },
    orderBy: [{ preferredDate: 'desc' }, { createdAt: 'desc' }],
  })

  return rows.map(mapAppointment)
}

export async function getDentistAppointmentStats(
  dentistId: string,
): Promise<DentistAppointmentStats> {
  if (!isDatabaseConfigured()) {
    return { pending: 0, confirmed: 0, completed: 0, cancelled: 0, today: 0 }
  }

  const today = new Date().toISOString().slice(0, 10)
  const [pending, confirmed, completed, cancelled, todayCount] = await Promise.all([
    prisma.dentistAppointment.count({ where: { dentistId, status: 'pending' } }),
    prisma.dentistAppointment.count({ where: { dentistId, status: 'confirmed' } }),
    prisma.dentistAppointment.count({ where: { dentistId, status: 'completed' } }),
    prisma.dentistAppointment.count({ where: { dentistId, status: 'cancelled' } }),
    prisma.dentistAppointment.count({
      where: {
        dentistId,
        preferredDate: today,
        status: { in: ['pending', 'confirmed'] },
      },
    }),
  ])

  return {
    pending,
    confirmed,
    completed,
    cancelled,
    today: todayCount,
  }
}

export async function updateDentistAppointment(input: {
  appointmentId: string
  dentistId: string
  status?: AppointmentStatus
  dentistNotes?: string
}): Promise<DentistAppointmentRecord | null> {
  if (!isDatabaseConfigured()) return null

  const existing = await prisma.dentistAppointment.findFirst({
    where: {
      appointmentId: input.appointmentId,
      dentistId: input.dentistId,
    },
  })

  if (!existing) return null

  const row = await prisma.dentistAppointment.update({
    where: { id: existing.id },
    data: {
      ...(input.status ? { status: input.status } : {}),
      ...(input.dentistNotes !== undefined ? { dentistNotes: input.dentistNotes } : {}),
    },
  })

  return mapAppointment(row)
}
