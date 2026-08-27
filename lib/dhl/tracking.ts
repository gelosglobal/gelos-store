import { dhlFetch } from '@/lib/dhl/client'
import type { DhlTrackingEvent } from '@/lib/dhl/types'

export type DhlTrackingResult = {
  trackingNumber: string
  status?: string
  description?: string
  events: DhlTrackingEvent[]
}

type TrackingApiResponse = {
  shipments?: Array<{
    shipmentTrackingNumber?: string
    status?: string
    description?: string
    events?: Array<{
      date?: string
      time?: string
      typeCode?: string
      description?: string
      serviceArea?: Array<{ description?: string; code?: string }>
    }>
  }>
}

export async function fetchDhlTracking(
  trackingNumber: string,
): Promise<DhlTrackingResult> {
  const id = trackingNumber.trim()
  if (!id) throw new Error('Tracking number is required')

  const params = new URLSearchParams({
    trackingView: 'all-checkpoints',
    levelOfDetail: 'all',
  })

  const json = await dhlFetch<TrackingApiResponse>(
    `/shipments/${encodeURIComponent(id)}/tracking?${params.toString()}`,
    { method: 'GET' },
  )

  const shipment = json.shipments?.[0]
  const events: DhlTrackingEvent[] = (shipment?.events ?? []).map((event) => ({
    timestamp: [event.date, event.time].filter(Boolean).join('T') || undefined,
    typeCode: event.typeCode,
    description: event.description,
    serviceArea:
      event.serviceArea?.[0]?.description || event.serviceArea?.[0]?.code,
  }))

  return {
    trackingNumber: shipment?.shipmentTrackingNumber || id,
    status: shipment?.status,
    description: shipment?.description,
    events,
  }
}
