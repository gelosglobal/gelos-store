import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  isVisitorFunnelEvent,
  recordVisitorFunnelEvent,
} from '@/lib/db/visitor-funnel'

const bodySchema = z.object({
  visitorId: z.string().min(8).max(120),
  event: z.string().min(1).max(40),
})

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const parsed = bodySchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid funnel event' }, { status: 400 })
    }

    if (!isVisitorFunnelEvent(parsed.data.event)) {
      return NextResponse.json({ error: 'Unknown funnel event' }, { status: 400 })
    }

    const result = await recordVisitorFunnelEvent({
      visitorId: parsed.data.visitorId,
      event: parsed.data.event,
    })

    if (!result.ok) {
      return NextResponse.json({ ok: false })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[POST /api/visitors/funnel]', error)
    return NextResponse.json({ error: 'Funnel event failed' }, { status: 500 })
  }
}
