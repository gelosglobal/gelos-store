import { NextResponse } from 'next/server'
import { DhlApiError } from '@/lib/dhl/client'
import { isDhlConfigured } from '@/lib/dhl/config'
import { normalizeDhlTrackingNumber } from '@/lib/dhl/checkpoints'
import { getPublicDhlTracking } from '@/lib/dhl/public-tracking'

export async function GET(request: Request) {
  if (!isDhlConfigured()) {
    return NextResponse.json(
      { error: 'Tracking is temporarily unavailable' },
      { status: 503 },
    )
  }

  const { searchParams } = new URL(request.url)
  const raw =
    searchParams.get('number') ||
    searchParams.get('trackingNumber') ||
    ''
  const trackingNumber = normalizeDhlTrackingNumber(raw)
  if (!trackingNumber) {
    return NextResponse.json(
      { error: 'Enter a valid DHL tracking number' },
      { status: 400 },
    )
  }

  try {
    const tracking = await getPublicDhlTracking(trackingNumber)
    return NextResponse.json({ ok: true, tracking })
  } catch (error) {
    if (error instanceof DhlApiError && (error.status === 404 || error.status === 400)) {
      return NextResponse.json(
        { error: 'No shipment found for that tracking number' },
        { status: 404 },
      )
    }
    const message =
      error instanceof Error ? error.message : 'Failed to load tracking'
    console.error('[GET /api/dhl/track]', error)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
