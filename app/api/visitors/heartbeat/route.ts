import { NextResponse } from 'next/server'
import { z } from 'zod'
import { upsertVisitorHeartbeat } from '@/lib/db/visitor-sessions'
import { getGeoFromRequestHeaders } from '@/lib/visitor-location'

const bodySchema = z.object({
  visitorId: z.string().min(8).max(120),
  path: z.string().max(500),
  referrer: z.string().max(500).optional(),
  landingPath: z.string().max(500).optional(),
  landingReferrer: z.string().max(500).optional(),
  utmSource: z.string().max(120).optional(),
  utmMedium: z.string().max(120).optional(),
  utmCampaign: z.string().max(120).optional(),
  locationId: z
    .enum(['international', 'nigeria', 'ghana', 'usa'])
    .optional(),
})

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const parsed = bodySchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid heartbeat' }, { status: 400 })
    }

    const geo = getGeoFromRequestHeaders(request.headers)
    const result = await upsertVisitorHeartbeat({
      ...parsed.data,
      geoCity: geo.city,
      geoCountry: geo.country,
    })
    if (!result.ok) {
      return NextResponse.json({ ok: false })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[POST /api/visitors/heartbeat]', error)
    return NextResponse.json({ error: 'Heartbeat failed' }, { status: 500 })
  }
}
