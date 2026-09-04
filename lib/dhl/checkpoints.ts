import type { DhlTrackingEvent } from '@/lib/dhl/types'

/**
 * Official DHL checkpoint list from
 * Tracking Events (DHL Checkpoint Codes).xlsx
 */
export const DHL_CHECKPOINT_LABELS: Record<string, string> = {
  AD: 'Agreed delivery',
  AF: 'Arrived facility',
  AR: 'Arrival in delivery facility',
  BA: 'Bad address',
  BN: 'Customer broker notified',
  BR: 'Broker release',
  CA: 'Closed on arrival',
  CC: 'Awaiting consignee collection',
  CD: 'Controllable clearance delay',
  CM: 'Customer moved',
  CR: 'Clearance release',
  CS: 'Closed shipment',
  DD: 'Delivered damaged',
  DF: 'Depart facility',
  DS: 'Destroyed / disposal',
  FD: "Forward destination (DD's expected)",
  HP: 'Held for payment',
  IC: 'In clearance processing',
  MC: 'Miscode',
  MD: 'Missed delivery cycle',
  MS: 'Mis-sort',
  ND: 'Not delivered',
  NH: 'Not home',
  OH: 'On hold',
  OK: 'Delivery',
  PD: 'Partial delivery',
  PL: 'Processed at location',
  PU: 'Shipment pick up',
  RD: 'Refused delivery',
  RR: 'Response received',
  RT: 'Returned to consignor',
  SA: 'Shipment acceptance',
  SC: 'Service changed',
  SS: 'Shipment stopped',
  TP: 'Forwarded to 3rd party - no DD\'s',
  TR: 'Record of transfer',
  UD: 'Uncontrollable clearance delay',
  WC: 'With delivering courier',
}

/**
 * Major journey events for customers — per DHL demo guidance:
 * show majors only (left Ghana, arrived destination, out for delivery,
 * delivered), not every facility scan. Codes from the Excel sheet.
 */
export const CUSTOMER_CHECKPOINT_CODES = new Set([
  'PU',
  'SA',
  'DF',
  'AF',
  'AR',
  'IC',
  'CR',
  'WC',
  'OK',
  'BA',
  'ND',
  'NH',
  'OH',
  'HP',
  'DD',
  'RD',
  'RT',
  'CC',
])

/** Short customer-facing labels mapped from Excel codes + DHL journey language. */
const CUSTOMER_LABELS: Record<string, string> = {
  PU: 'Shipment pick up',
  SA: 'Shipment acceptance',
  DF: 'Left Ghana',
  AF: 'Arrived facility',
  AR: 'Arrival in delivery facility',
  IC: 'In clearance processing',
  CR: 'Clearance release',
  WC: 'Out for delivery',
  OK: 'Delivered',
  BA: 'Bad address',
  ND: 'Not delivered',
  NH: 'Not home',
  OH: 'On hold',
  HP: 'Held for payment',
  DD: 'Delivered damaged',
  RD: 'Refused delivery',
  RT: 'Returned to consignor',
  CC: 'Awaiting consignee collection',
}

/** Shared copy for emails, FAQs, and the track page. */
export const CUSTOMER_JOURNEY_COPY =
  'shipment pick up, left Ghana, arrived, out for delivery, and delivered'

/**
 * Four major timeline stages for the public track UI
 * (matches DHL’s “major checkpoints only” guidance).
 */
export const CUSTOMER_TIMELINE_STEPS = [
  {
    id: 'pickup',
    label: 'Shipment pick up',
    fallback: 'DHL has collected the shipment.',
    codes: ['PU', 'SA'],
  },
  {
    id: 'depart',
    label: 'Left Ghana',
    fallback: 'The shipment has left the origin facility.',
    codes: ['DF'],
  },
  {
    id: 'arrived',
    label: 'Arrived',
    fallback: 'Arrived at a DHL facility in the destination country.',
    codes: ['AF', 'AR', 'IC', 'CR'],
  },
  {
    id: 'delivery',
    label: 'Out for delivery',
    deliveredLabel: 'Delivered',
    fallback: 'With the delivering courier, or delivered to the recipient.',
    codes: ['WC', 'CC', 'OK'],
  },
] as const

export function checkpointCode(event: DhlTrackingEvent): string {
  return (event.typeCode ?? '').trim().toUpperCase()
}

export function isCustomerCheckpoint(event: DhlTrackingEvent): boolean {
  const code = checkpointCode(event)
  return code ? CUSTOMER_CHECKPOINT_CODES.has(code) : false
}

export function customerCheckpointLabel(event: DhlTrackingEvent): string {
  const code = checkpointCode(event)
  return (
    CUSTOMER_LABELS[code] ||
    DHL_CHECKPOINT_LABELS[code] ||
    event.description ||
    'Update'
  )
}

function eventTime(event: DhlTrackingEvent): number {
  if (!event.timestamp) return 0
  const parsed = Date.parse(event.timestamp)
  return Number.isFinite(parsed) ? parsed : 0
}

export function filterCustomerTrackingEvents(
  events: DhlTrackingEvent[],
): DhlTrackingEvent[] {
  const majors = events.filter(isCustomerCheckpoint)
  if (majors.length === 0) return []
  const seen = new Set<string>()
  const unique: DhlTrackingEvent[] = []
  // Keep the latest occurrence of each major code, then show oldest → newest.
  const newestFirst = [...majors].sort((a, b) => eventTime(b) - eventTime(a))
  for (const event of newestFirst) {
    const code = checkpointCode(event) || event.description || 'UPDATE'
    if (seen.has(code)) continue
    seen.add(code)
    unique.push(event)
  }
  return unique.sort((a, b) => eventTime(a) - eventTime(b))
}

export type CustomerTrackingEvent = {
  code: string
  label: string
  description?: string
  location?: string
  at?: string
}

export function toCustomerTrackingEvents(
  events: DhlTrackingEvent[],
): CustomerTrackingEvent[] {
  return filterCustomerTrackingEvents(events).map((event) => ({
    code: checkpointCode(event),
    label: customerCheckpointLabel(event),
    description: event.description || undefined,
    location: event.serviceArea || undefined,
    at: event.timestamp,
  }))
}

export function formatCheckpointTime(value?: string): string | undefined {
  if (!value?.trim()) return undefined
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) return value.replace('T', ' ')
  return new Date(parsed).toLocaleString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function normalizeDhlTrackingNumber(raw: string): string | null {
  const id = raw.trim().toUpperCase().replace(/[\s-]+/g, '')
  if (!/^[A-Z0-9]{8,39}$/.test(id)) return null
  return id
}
