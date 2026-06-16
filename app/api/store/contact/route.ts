import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createInboundMessage } from '@/lib/db/inbox'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional(),
  subject: z.string().trim().max(120).optional(),
  message: z.string().trim().min(2).max(3000),
})

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const parsed = bodySchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid message', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { thread } = await createInboundMessage({
      customerName: parsed.data.name,
      customerEmail: parsed.data.email,
      customerPhone: parsed.data.phone,
      subject: parsed.data.subject,
      message: parsed.data.message,
    })

    return NextResponse.json({ ok: true, threadId: thread.threadId })
  } catch (error) {
    console.error('[POST /api/store/contact]', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 },
    )
  }
}

