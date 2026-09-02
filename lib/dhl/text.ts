export function clip(value: string, max: number): string {
  return value.trim().slice(0, max)
}

export function dhlPhone(value: string | undefined, fallback: string): string {
  const raw = (value ?? '').trim() || fallback
  const digits = raw.replace(/[^\d+]/g, '')
  if (digits.startsWith('+')) return clip(digits, 20)
  const only = digits.replace(/\D/g, '')
  if (!only) return clip(fallback, 20)
  return clip(`+${only}`, 20)
}

export function nextWeekdayDate(from = new Date()): Date {
  const date = new Date(from)
  const day = date.getDay()
  if (day === 6) date.setDate(date.getDate() + 2)
  if (day === 0) date.setDate(date.getDate() + 1)
  return date
}

export function isoDate(date = new Date()): string {
  return date.toISOString().slice(0, 10)
}

/** MyDHL timestamp: `YYYY-MM-DDTHH:MM:SSGMT+00:00` */
export function plannedShippingDateAndTime(
  offset = 'GMT+00:00',
  hour = 13,
): string {
  const date = nextWeekdayDate()
  const ymd = isoDate(date)
  const hh = String(hour).padStart(2, '0')
  return `${ymd}T${hh}:00:00${offset}`
}

export function messageReference(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 32)
}

export function formatDhlDeliveryDate(value?: string): string | undefined {
  if (!value?.trim()) return undefined
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return undefined
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}
