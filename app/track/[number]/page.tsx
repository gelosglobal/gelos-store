import type { Metadata } from 'next'
import { TrackShipmentPage } from '@/components/track-shipment-page'
import { DhlApiError } from '@/lib/dhl/client'
import { normalizeDhlTrackingNumber } from '@/lib/dhl/checkpoints'
import { isDhlConfigured } from '@/lib/dhl/config'
import { findDeliveryRatingByTracking } from '@/lib/db/delivery-ratings'
import { getPublicDhlTracking } from '@/lib/dhl/public-tracking'
import type { PublicTrackingView } from '@/lib/dhl/public-tracking'

type TrackNumberPageProps = {
  params: Promise<{ number: string }>
}

export const metadata: Metadata = {
  title: 'Track your order | Gelos',
  description:
    'Track Gelos DHL Express shipments. Major checkpoints only: shipment pick up, left Ghana, arrived, out for delivery, and delivered.',
}

export default async function TrackNumberPage({ params }: TrackNumberPageProps) {
  const { number } = await params
  const trackingNumber =
    normalizeDhlTrackingNumber(decodeURIComponent(number)) ??
    decodeURIComponent(number)

  let tracking: PublicTrackingView | null = null
  let error: string | null = null
  let initialRated = false

  if (!normalizeDhlTrackingNumber(trackingNumber)) {
    error = 'Enter a valid DHL tracking number'
  } else if (!isDhlConfigured()) {
    error = 'Tracking is temporarily unavailable'
  } else {
    try {
      tracking = await getPublicDhlTracking(trackingNumber)
      if (tracking.delivered) {
        const existing = await findDeliveryRatingByTracking(trackingNumber)
        initialRated = Boolean(existing)
      }
    } catch (err) {
      if (err instanceof DhlApiError && (err.status === 404 || err.status === 400)) {
        error = 'No shipment found for that tracking number'
      } else {
        error = err instanceof Error ? err.message : 'Unable to load tracking'
      }
    }
  }

  return (
    <TrackShipmentPage
      initialNumber={trackingNumber}
      initialTracking={tracking}
      initialError={error}
      initialRated={initialRated}
    />
  )
}
