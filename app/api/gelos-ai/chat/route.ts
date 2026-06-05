import { NextResponse } from 'next/server'
import { z } from 'zod'
import { chatWithGroq } from '@/lib/gelos-ai/groq'
import { buildGelosAiCatalogContext } from '@/lib/gelos-ai/knowledge'
import { buildGelosAiSystemPrompt } from '@/lib/gelos-ai/prompt'
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

    const catalogContext = await buildGelosAiCatalogContext()
    const systemPrompt = buildGelosAiSystemPrompt(catalogContext)
    const reply = await chatWithGroq(systemPrompt, parsed.data.messages)

    return NextResponse.json({ message: { role: 'assistant' as const, content: reply } })
  } catch (error) {
    console.error('[POST /api/gelos-ai/chat]', error)
    const message =
      error instanceof Error ? error.message : 'Something went wrong. Please try again.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
