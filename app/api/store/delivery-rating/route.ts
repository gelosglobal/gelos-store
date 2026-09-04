import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  createDeliveryRating,
  findDeliveryRatingByTracking,
} from '@/lib/db/delivery-ratings'
import { isDatabaseConfigured } from '@/lib/env'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  trackingNumber: z.string().trim().min(8).max(39),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
  customerName: z.string().trim().max(120).optional(),
  customerEmail: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((value) => (value ? value : undefined))
    .pipe(z.string().email().optional()),
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const number = searchParams.get('number') || searchParams.get('trackingNumber') || ''
  if (!number.trim()) {
    return NextResponse.json({ error: 'Tracking number required' }, { status: 400 })
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: true, rating: null })
  }

  try {
    const rating = await findDeliveryRatingByTracking(number)
    return NextResponse.json({ ok: true, rating })
  } catch (error) {
    console.error('[GET /api/store/delivery-rating]', error)
    return NextResponse.json({ error: 'Failed to load rating' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: 'Ratings are temporarily unavailable' },
      { status: 503 },
    )
  }

  try {
    const json = await request.json()
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid rating', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const rating = await createDeliveryRating({
      trackingNumber: parsed.data.trackingNumber,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
      customerName: parsed.data.customerName,
      customerEmail: parsed.data.customerEmail || undefined,
    })

    return NextResponse.json({ ok: true, rating })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save rating'
    if (message === 'ALREADY_RATED') {
      return NextResponse.json(
        { error: 'This delivery was already rated' },
        { status: 409 },
      )
    }
    if (message === 'INVALID_TRACKING_NUMBER' || message === 'INVALID_RATING') {
      return NextResponse.json({ error: 'Invalid rating details' }, { status: 400 })
    }
    console.error('[POST /api/store/delivery-rating]', error)
    return NextResponse.json({ error: 'Failed to save rating' }, { status: 500 })
  }
}
