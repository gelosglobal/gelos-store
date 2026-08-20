import { NextResponse } from 'next/server'
import { z } from 'zod'
import { isAdminDatabaseReady } from '@/lib/db/admin-products'
import {
  getWhatsappAdminThread,
  setWhatsappAiPaused,
} from '@/lib/whatsapp-agent/admin'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ whatsappId: string }> }

const pauseSchema = z.object({
  aiPaused: z.boolean(),
  reason: z.string().trim().max(500).optional().nullable(),
})

export async function GET(_request: Request, context: RouteContext) {
  if (!isAdminDatabaseReady()) {
    return NextResponse.json(
      { error: 'Database is not connected.' },
      { status: 503 },
    )
  }

  try {
    const { whatsappId } = await context.params
    const thread = await getWhatsappAdminThread(decodeURIComponent(whatsappId))
    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }
    return NextResponse.json(thread)
  } catch (error) {
    console.error('[GET /api/admin/whatsapp/[whatsappId]]', error)
    return NextResponse.json(
      { error: 'Failed to load thread' },
      { status: 500 },
    )
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!isAdminDatabaseReady()) {
    return NextResponse.json(
      { error: 'Database is not connected.' },
      { status: 503 },
    )
  }

  try {
    const { whatsappId } = await context.params
    const json = await request.json()
    const parsed = pauseSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid request' },
        { status: 400 },
      )
    }

    const customer = await setWhatsappAiPaused(
      decodeURIComponent(whatsappId),
      parsed.data.aiPaused,
      parsed.data.reason,
    )

    return NextResponse.json({
      whatsappId: customer.whatsapp_id,
      aiPaused: customer.ai_paused,
      aiPausedReason: customer.ai_paused_reason,
    })
  } catch (error) {
    console.error('[PATCH /api/admin/whatsapp/[whatsappId]]', error)
    return NextResponse.json(
      { error: 'Failed to update AI pause' },
      { status: 500 },
    )
  }
}
