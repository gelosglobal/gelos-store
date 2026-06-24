export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

export type DentistAppointmentRecord = {
  id: string
  appointmentId: string
  dentistId: string
  patientName: string
  patientEmail: string
  patientPhone: string
  preferredDate: string
  preferredTime: string
  reason: string
  status: AppointmentStatus
  dentistNotes: string
  createdAt: string
  updatedAt: string
}

export type DentistAppointmentStats = {
  pending: number
  confirmed: number
  completed: number
  cancelled: number
  today: number
}

export const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  'pending',
  'confirmed',
  'completed',
  'cancelled',
]

export function isAppointmentStatus(value: string): value is AppointmentStatus {
  return APPOINTMENT_STATUSES.includes(value as AppointmentStatus)
}
