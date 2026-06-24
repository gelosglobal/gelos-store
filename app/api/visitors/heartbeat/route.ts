import { NextResponse } from 'next/server'
import { z } from 'zod'
import { upsertVisitorHeartbeat } from '@/lib/db/visitor-sessions'

const bodySchema = z.object({
  visitorId: z.string().min(8).max(120),
  path: z.string().max(500),
  referrer: z.string().max(500).optional(),
})

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const parsed = bodySchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid heartbeat' }, { status: 400 })
    }

    const result = await upsertVisitorHeartbeat(parsed.data)
    if (!result.ok) {
      return NextResponse.json({ ok: false })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[POST /api/visitors/heartbeat]', error)
    return NextResponse.json({ error: 'Heartbeat failed' }, { status: 500 })
  }
}
