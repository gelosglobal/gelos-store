import { NextResponse } from 'next/server'
import { z } from 'zod'
import { isAdminDatabaseReady } from '@/lib/db/admin-products'
import { sendWhatsappStaffReply } from '@/lib/whatsapp-agent/admin'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ whatsappId: string }> }

const replySchema = z.object({
  message: z.string().trim().min(1).max(4096),
})

export async function POST(request: Request, context: RouteContext) {
  if (!isAdminDatabaseReady()) {
    return NextResponse.json(
      { error: 'Database is not connected.' },
      { status: 503 },
    )
  }

  try {
    const { whatsappId } = await context.params
    const json = await request.json()
    const parsed = replySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid reply' },
        { status: 400 },
      )
    }

    await sendWhatsappStaffReply(
      decodeURIComponent(whatsappId),
      parsed.data.message,
    )
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to send reply'
    console.error('[POST /api/admin/whatsapp/[whatsappId]/reply]', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
