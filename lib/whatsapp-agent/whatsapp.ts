import crypto from 'crypto'
import type { WhatsappAgentConfig } from '@/lib/whatsapp-agent/config'

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left)
  const b = Buffer.from(right)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

export function verifyWebhookSignature(
  rawBody: Buffer | Uint8Array | string,
  signatureHeader: string | null | undefined,
  appSecret: string,
) {
  if (!appSecret || !signatureHeader?.startsWith('sha256=')) return false
  const expected = `sha256=${crypto
    .createHmac('sha256', appSecret)
    .update(rawBody)
    .digest('hex')}`
  return safeEqual(expected, signatureHeader)
}

function interactiveText(message: {
  type?: string
  button?: { text?: string; payload?: string }
  interactive?: {
    button_reply?: { title?: string; id?: string }
    list_reply?: { title?: string; id?: string }
  }
}) {
  if (message.type === 'button') {
    return message.button?.text || message.button?.payload || ''
  }
  if (message.type !== 'interactive') return ''
  return (
    message.interactive?.button_reply?.title ||
    message.interactive?.button_reply?.id ||
    message.interactive?.list_reply?.title ||
    message.interactive?.list_reply?.id ||
    ''
  )
}

export type IncomingWhatsappMessage = {
  id: string
  from: string
  displayName: string | null
  type?: string
  text: string
  location: {
    latitude: number
    longitude: number
    name: string | null
    address: string | null
    url: string
  } | null
  timestamp: string | null
}

export function extractIncomingMessages(
  payload: Record<string, unknown>,
): IncomingWhatsappMessage[] {
  const messages: IncomingWhatsappMessage[] = []
  for (const entry of (payload.entry as Array<Record<string, unknown>>) || []) {
    for (const change of (entry.changes as Array<Record<string, unknown>>) ||
      []) {
      const value = (change.value || {}) as Record<string, unknown>
      for (const message of (value.messages as Array<Record<string, unknown>>) ||
        []) {
        const contacts = (value.contacts as Array<Record<string, unknown>>) || []
        const contact = contacts.find(
          (candidate) => candidate.wa_id === message.from,
        )
        let text =
          (message.text as { body?: string } | undefined)?.body ||
          interactiveText(message as never)
        let location: IncomingWhatsappMessage['location'] = null
        const loc = message.location as
          | {
              latitude: number
              longitude: number
              name?: string
              address?: string
            }
          | undefined
        if (message.type === 'location' && loc) {
          location = {
            latitude: loc.latitude,
            longitude: loc.longitude,
            name: loc.name || null,
            address: loc.address || null,
            url: `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`,
          }
          text = `Customer shared a WhatsApp location pin: latitude ${location.latitude}, longitude ${location.longitude}`
          if (location.name) text += `, place name ${location.name}`
          if (location.address) text += `, address ${location.address}`
          text += '. Save these coordinates when collecting delivery details.'
        }
        if (!text) {
          text = `[Customer sent an unsupported ${message.type || 'unknown'} message. Request text or a location pin.]`
        }
        messages.push({
          id: String(message.id),
          from: String(message.from),
          displayName:
            ((contact?.profile as { name?: string } | undefined)?.name as
              | string
              | undefined) || null,
          type: message.type as string | undefined,
          text,
          location,
          timestamp: (message.timestamp as string | undefined) || null,
        })
      }
    }
  }
  return messages
}

async function graphRequest(
  settings: WhatsappAgentConfig['meta'],
  path: string,
  body: Record<string, unknown>,
) {
  if (!settings.graphApiVersion) {
    throw new Error('META_GRAPH_API_VERSION is required.')
  }
  const response = await fetch(
    `https://graph.facebook.com/${settings.graphApiVersion}/${path}`,
    {
      method: 'POST',
      signal: AbortSignal.timeout(30_000),
      headers: {
        authorization: `Bearer ${settings.accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  )
  const text = await response.text()
  if (!response.ok) {
    throw new Error(`WhatsApp API failed (${response.status}): ${text}`)
  }
  return text ? JSON.parse(text) : {}
}

export async function sendTextMessage(
  to: string,
  text: string,
  settings: WhatsappAgentConfig['meta'],
) {
  return graphRequest(settings, `${settings.phoneNumberId}/messages`, {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: { preview_url: false, body: String(text).slice(0, 4096) },
  })
}

export async function markMessageRead(
  messageId: string,
  settings: WhatsappAgentConfig['meta'],
) {
  return graphRequest(settings, `${settings.phoneNumberId}/messages`, {
    messaging_product: 'whatsapp',
    status: 'read',
    message_id: messageId,
  })
}
