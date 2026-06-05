import { getGroqApiKey } from '@/lib/env'
import { parseSmileScanReport } from '@/lib/gelos-ai/parse-smile-scan'
import type { SmileScanReport } from '@/lib/gelos-ai/smile-scan-types'

const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'

type GroqVisionResponse = {
  choices?: Array<{
    message?: { content?: string }
  }>
  error?: { message?: string }
}

export async function analyzeSmileImage(
  imageDataUrl: string,
  systemPrompt: string,
): Promise<SmileScanReport> {
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
      model: GROQ_VISION_MODEL,
      temperature: 0.3,
      max_completion_tokens: 800,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Please analyze this smile photo and give your Gelos Smile Scan report.',
            },
            {
              type: 'image_url',
              image_url: { url: imageDataUrl },
            },
          ],
        },
      ],
    }),
  })

  const data = (await res.json()) as GroqVisionResponse

  if (!res.ok) {
    const message = data.error?.message ?? 'Smile scan failed'
    throw new Error(message)
  }

  const content = data.choices?.[0]?.message?.content?.trim()
  if (!content) {
    throw new Error('Smile scan returned an empty response')
  }

  return parseSmileScanReport(content)
}
