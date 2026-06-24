/** Mark's Dental Clinic — Monday to Saturday, 8:00 AM – 7:00 PM */
export const CLINIC_OPEN_HOUR = 8
export const CLINIC_CLOSE_HOUR = 19
export const CLINIC_HOURS_LABEL = 'Monday – Saturday, 8:00 AM – 7:00 PM'

const TIME_SLOT_MINUTES = [0, 30]

function formatHourLabel(hour24: number, minutes: number): string {
  const period = hour24 >= 12 ? 'PM' : 'AM'
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  const minuteLabel = minutes === 0 ? '00' : String(minutes)
  return `${hour12}:${minuteLabel} ${period}`
}

export function getClinicTimeSlots(): string[] {
  const slots: string[] = []

  for (let hour = CLINIC_OPEN_HOUR; hour <= CLINIC_CLOSE_HOUR; hour++) {
    for (const minutes of TIME_SLOT_MINUTES) {
      if (hour === CLINIC_CLOSE_HOUR && minutes > 0) continue
      slots.push(formatHourLabel(hour, minutes))
    }
  }

  return slots
}

export const CLINIC_TIME_SLOTS = getClinicTimeSlots()

function parseTimeSlot(slot: string): { hour: number; minutes: number } | null {
  const match = slot.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) return null

  let hour = Number(match[1])
  const minutes = Number(match[2])
  const period = match[3].toUpperCase()

  if (period === 'PM' && hour !== 12) hour += 12
  if (period === 'AM' && hour === 12) hour = 0

  return { hour, minutes }
}

export function parseClinicDate(value: string): Date | null {
  const date = new Date(`${value}T12:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

/** Clinic is open Monday (1) through Saturday (6). Closed Sunday (0). */
export function isClinicOpenDay(value: string | Date): boolean {
  const date = typeof value === 'string' ? parseClinicDate(value) : value
  if (!date) return false
  const day = date.getDay()
  return day >= 1 && day <= 6
}

export function isValidClinicTimeSlot(slot: string): boolean {
  const parsed = parseTimeSlot(slot)
  if (!parsed) return false

  const totalMinutes = parsed.hour * 60 + parsed.minutes
  const openMinutes = CLINIC_OPEN_HOUR * 60
  const closeMinutes = CLINIC_CLOSE_HOUR * 60

  return totalMinutes >= openMinutes && totalMinutes <= closeMinutes
}

export function getAvailableTimeSlotsForDate(dateValue: string): string[] {
  if (!isClinicOpenDay(dateValue)) return []

  const today = new Date()
  const todayKey = today.toISOString().slice(0, 10)
  if (dateValue !== todayKey) return CLINIC_TIME_SLOTS

  const nowMinutes = today.getHours() * 60 + today.getMinutes()

  return CLINIC_TIME_SLOTS.filter((slot) => {
    const parsed = parseTimeSlot(slot)
    if (!parsed) return false
    return parsed.hour * 60 + parsed.minutes > nowMinutes
  })
}

export function validateAppointmentSlot(
  preferredDate: string,
  preferredTime: string,
): { valid: true } | { valid: false; error: string } {
  if (!parseClinicDate(preferredDate)) {
    return { valid: false, error: 'Please choose a valid appointment date.' }
  }

  if (!isClinicOpenDay(preferredDate)) {
    return {
      valid: false,
      error: 'The clinic is closed on Sundays. Please choose Monday – Saturday.',
    }
  }

  if (!isValidClinicTimeSlot(preferredTime)) {
    return {
      valid: false,
      error: `Please choose a time within clinic hours (${CLINIC_HOURS_LABEL}).`,
    }
  }

  const available = getAvailableTimeSlotsForDate(preferredDate)
  if (!available.includes(preferredTime)) {
    return {
      valid: false,
      error: 'That time is no longer available. Please choose another slot.',
    }
  }

  return { valid: true }
}

export function getNextClinicDate(from = new Date()): string {
  const cursor = new Date(from)
  cursor.setHours(12, 0, 0, 0)

  for (let i = 0; i < 14; i++) {
    const key = cursor.toISOString().slice(0, 10)
    if (isClinicOpenDay(key)) return key
    cursor.setDate(cursor.getDate() + 1)
  }

  return from.toISOString().slice(0, 10)
}
