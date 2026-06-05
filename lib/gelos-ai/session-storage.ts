import type { GelosAiMessage } from '@/lib/gelos-ai/types'
import type { SmileScanReport } from '@/lib/gelos-ai/smile-scan-types'

export type AiFeatureTab = 'chat' | 'scan' | 'dentist'

export type SmileScanSession = {
  preview: string | null
  report: SmileScanReport | null
  name: string
}

const KEYS = {
  activeTab: 'gelos-ai:active-tab',
  smileScan: 'gelos-ai:smile-scan',
  chat: 'gelos-ai:chat',
  sessionId: 'gelos-ai:session-id',
} as const

function canUseSessionStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'
}

function readJson<T>(key: string): T | null {
  if (!canUseSessionStorage()) return null
  try {
    const raw = window.sessionStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function writeJson(key: string, value: unknown): void {
  if (!canUseSessionStorage()) return
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore quota errors for large smile photos
  }
}

function remove(key: string): void {
  if (!canUseSessionStorage()) return
  window.sessionStorage.removeItem(key)
}

export function loadActiveTab(): AiFeatureTab | null {
  const tab = readJson<AiFeatureTab>(KEYS.activeTab)
  if (tab === 'chat' || tab === 'scan' || tab === 'dentist') return tab
  return null
}

export function saveActiveTab(tab: AiFeatureTab): void {
  writeJson(KEYS.activeTab, tab)
}

export function loadSmileScanSession(): SmileScanSession | null {
  const session = readJson<SmileScanSession>(KEYS.smileScan)
  if (!session) return null
  return {
    preview: typeof session.preview === 'string' ? session.preview : null,
    report: session.report ?? null,
    name: typeof session.name === 'string' ? session.name : '',
  }
}

export function saveSmileScanSession(session: SmileScanSession): void {
  if (!session.preview && !session.report && !session.name.trim()) {
    remove(KEYS.smileScan)
    return
  }
  writeJson(KEYS.smileScan, session)
}

export function clearSmileScanSession(): void {
  remove(KEYS.smileScan)
}

export function loadChatMessages(): GelosAiMessage[] | null {
  const messages = readJson<GelosAiMessage[]>(KEYS.chat)
  if (!Array.isArray(messages) || messages.length === 0) return null
  return messages.filter(
    (message) =>
      message &&
      (message.role === 'user' || message.role === 'assistant') &&
      typeof message.content === 'string',
  )
}

export function saveChatMessages(messages: GelosAiMessage[]): void {
  writeJson(KEYS.chat, messages)
}

export function clearChatMessages(): void {
  remove(KEYS.chat)
}

export function getOrCreateGelosAiSessionId(): string {
  if (!canUseSessionStorage()) {
    return `guest-${Date.now()}`
  }

  const existing = window.sessionStorage.getItem(KEYS.sessionId)
  if (existing) return existing

  const sessionId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`

  window.sessionStorage.setItem(KEYS.sessionId, sessionId)
  return sessionId
}
