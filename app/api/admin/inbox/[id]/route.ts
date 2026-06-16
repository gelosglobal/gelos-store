import { NextResponse } from 'next/server'
import { z } from 'zod'
import { isAdminDatabaseReady } from '@/lib/db/admin-products'
import { getInboxThread, listThreadMessages, replyToThread } from '@/lib/db/inbox'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

const replySchema = z.object({
  body: z.string().trim().min(1).max(3000),
})

export async function GET(_request: Request, context: RouteContext) {
  if (!isAdminDatabaseReady()) {
    return NextResponse.json(
      { error: 'Database is not connected.' },
      { status: 503 },
    )
  }

  try {
    const { id } = await context.params
    const thread = await getInboxThread(id)
    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }
    const messages = await listThreadMessages(id)
    return NextResponse.json({ thread, messages })
  } catch (error) {
    console.error('[GET /api/admin/inbox/[id]]', error)
    return NextResponse.json(
      { error: 'Failed to load thread' },
      { status: 500 },
    )
  }
}

export async function POST(request: Request, context: RouteContext) {
  if (!isAdminDatabaseReady()) {
    return NextResponse.json(
      { error: 'Database is not connected.' },
      { status: 503 },
    )
  }

  try {
    const { id } = await context.params
    const json = await request.json()
    const parsed = replySchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid reply' },
        { status: 400 },
      )
    }

    const result = await replyToThread({
      threadId: id,
      body: parsed.data.body,
      sentBy: 'admin',
    })

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to reply'
    const status =
      message === 'THREAD_NOT_FOUND'
        ? 404
        : message === 'EMPTY_MESSAGE'
          ? 400
          : 500
    console.error('[POST /api/admin/inbox/[id]]', error)
    return NextResponse.json({ error: message }, { status })
  }
}

