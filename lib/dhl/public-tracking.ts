import {
  customerCheckpointLabel,
  filterCustomerTrackingEvents,
  formatCheckpointTime,
  normalizeDhlTrackingNumber,
  toCustomerTrackingEvents,
} from '@/lib/dhl/checkpoints'
import { dhlTrackingUrl } from '@/lib/dhl/shipping-details'
import { fetchDhlTracking } from '@/lib/dhl/tracking'
import type { DhlTrackingEvent } from '@/lib/dhl/types'

export type PublicTrackingEventView = {
  code: string
  label: string
  description?: string
  location?: string
  at?: string
  atLabel?: string
}

export type PublicTrackingView = {
  trackingNumber: string
  dhlTrackingUrl: string
  statusLabel: string
  delivered: boolean
  events: PublicTrackingEventView[]
}

function isDelivered(events: DhlTrackingEvent[], status?: string): boolean {
  const text = (status ?? '').toLowerCase()
  if (text.includes('delivered')) return true
  return events.some((event) => (event.typeCode ?? '').toUpperCase() === 'OK')
}

export async function getPublicDhlTracking(
  rawTrackingNumber: string,
): Promise<PublicTrackingView> {
  const trackingNumber = normalizeDhlTrackingNumber(rawTrackingNumber)
  if (!trackingNumber) {
    throw new Error('Enter a valid DHL tracking number')
  }

  const tracking = await fetchDhlTracking(trackingNumber)
  const customerEvents = filterCustomerTrackingEvents(tracking.events)
  const latest = customerEvents[customerEvents.length - 1]
  const delivered = isDelivered(tracking.events, tracking.status)

  return {
    trackingNumber: tracking.trackingNumber,
    dhlTrackingUrl: dhlTrackingUrl(tracking.trackingNumber),
    statusLabel: delivered
      ? 'Delivered'
      : latest
        ? customerCheckpointLabel(latest)
        : tracking.description || tracking.status || 'Shipment acceptance',
    delivered,
    events: toCustomerTrackingEvents(tracking.events).map((event) => ({
      ...event,
      atLabel: formatCheckpointTime(event.at),
    })),
  }
}
