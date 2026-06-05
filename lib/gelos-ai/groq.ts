import { getGroqApiKey } from '@/lib/env'
import type { GelosAiMessage } from '@/lib/gelos-ai/types'

const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

type GroqChatResponse = {
  choices?: Array<{
    message?: { content?: string }
  }>
  error?: { message?: string }
}

export async function chatWithGroq(
  systemPrompt: string,
  messages: GelosAiMessage[],
): Promise<string> {
  const apiKey = getGroqApiKey()
  if (!apiKey) {
    throw new Error('Gelos AI is not configured')
  }

  const res = await fetch(GROQ_CHAT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.6,
      max_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    }),
  })

  const data = (await res.json()) as GroqChatResponse

  if (!res.ok) {
    const message = data.error?.message ?? 'Gelos AI request failed'
    throw new Error(message)
  }

  const content = data.choices?.[0]?.message?.content?.trim()
  if (!content) {
    throw new Error('Gelos AI returned an empty response')
  }

  return content
}
