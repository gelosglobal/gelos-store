import { NextResponse } from 'next/server'
import { z } from 'zod'
import { enhanceChatReply } from '@/lib/gelos-ai/chat-reply'
import { chatWithGroq } from '@/lib/gelos-ai/groq'
import { buildGelosAiCatalogContext } from '@/lib/gelos-ai/knowledge'
import { buildGelosAiSystemPrompt } from '@/lib/gelos-ai/prompt'
import { getSmileScanCatalog } from '@/lib/gelos-ai/smile-scan-catalog'
import { isGroqConfigured } from '@/lib/env'

export const dynamic = 'force-dynamic'

const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().trim().min(1).max(4000),
      }),
    )
    .min(1)
    .max(24),
})

export async function POST(request: Request) {
  if (!isGroqConfigured()) {
    return NextResponse.json(
      { error: 'Gelos AI is not available right now.' },
      { status: 503 },
    )
  }

  try {
    const json = await request.json()
    const parsed = chatRequestSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid chat request.', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const [catalogContext, catalog] = await Promise.all([
      buildGelosAiCatalogContext(),
      getSmileScanCatalog(),
    ])
    const systemPrompt = buildGelosAiSystemPrompt(catalogContext)
    const rawReply = await chatWithGroq(systemPrompt, parsed.data.messages)
    const reply = enhanceChatReply(rawReply, catalog)

    return NextResponse.json({ message: { role: 'assistant' as const, content: reply } })
  } catch (error) {
    console.error('[POST /api/gelos-ai/chat]', error)
    const message =
      error instanceof Error ? error.message : 'Something went wrong. Please try again.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
