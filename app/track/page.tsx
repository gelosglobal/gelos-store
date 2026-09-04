import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { TrackShipmentPage } from '@/components/track-shipment-page'
import { normalizeDhlTrackingNumber } from '@/lib/dhl/checkpoints'

export const metadata: Metadata = {
  title: 'Track your order | Gelos',
  description:
    'Track Gelos DHL Express shipments. Major checkpoints only: shipment pick up, left Ghana, arrived, out for delivery, and delivered.',
}

type TrackPageProps = {
  searchParams: Promise<{ number?: string }>
}

export default async function TrackPage({ searchParams }: TrackPageProps) {
  const { number } = await searchParams
  const raw = number?.trim() ?? ''
  if (!raw) return <TrackShipmentPage />

  const trackingNumber = normalizeDhlTrackingNumber(raw)
  if (trackingNumber) {
    redirect(`/track/${encodeURIComponent(trackingNumber)}`)
  }

  return (
    <TrackShipmentPage
      initialNumber={raw}
      initialError="Enter a valid DHL tracking number"
    />
  )
}
