import type { GelosAiMessage } from '@/lib/gelos-ai/types'

export const CHAT_WELCOME_MESSAGE: GelosAiMessage = {
  role: 'assistant',
  content:
    "Hi, I'm your **wellness expert** — your smile care guide. Ask me about flavors, whitening, mouthwash, bundles, or finding the right product for your routine.",
}

const LEGACY_WELCOME_PATTERNS = [
  /Gelos AI/i,
  /gelos product expert/i,
]

export function isLegacyWelcomeMessage(content: string): boolean {
  return LEGACY_WELCOME_PATTERNS.some((pattern) => pattern.test(content))
}

export function migrateChatMessages(messages: GelosAiMessage[]): GelosAiMessage[] {
  if (!messages.length) return [CHAT_WELCOME_MESSAGE]

  const [first, ...rest] = messages
  if (first.role === 'assistant' && isLegacyWelcomeMessage(first.content)) {
    return [CHAT_WELCOME_MESSAGE, ...rest]
  }

  return messages
}
