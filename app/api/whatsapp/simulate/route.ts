import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getWhatsappAgentConfig } from '@/lib/whatsapp-agent/config'
import { processIncomingMessage } from '@/lib/whatsapp-agent/process'

export const runtime = 'nodejs'
export const maxDuration = 60

function authorizeAdmin(request: NextRequest, token: string) {
  if (!token) return false
  const authorization = request.headers.get('authorization') || ''
  const bearer = authorization.startsWith('Bearer ')
    ? authorization.slice(7)
    : ''
  return bearer === token
}

/** Local/admin simulation without sending WhatsApp replies. */
export async function POST(request: NextRequest) {
  const config = getWhatsappAgentConfig()
  if (!config.adminApiToken) {
    return NextResponse.json(
      {
        error:
          'WHATSAPP_AGENT_ADMIN_TOKEN must be configured before using admin endpoints.',
      },
      { status: 503 },
    )
  }
  if (!authorizeAdmin(request, config.adminApiToken)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  let body: {
    whatsapp_id?: string
    message?: string
    message_id?: string
    name?: string
  }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  if (!body.whatsapp_id || !body.message) {
    return NextResponse.json(
      { error: 'whatsapp_id and message are required.' },
      { status: 400 },
    )
  }

  const result = await processIncomingMessage(
    {
      id: body.message_id || `simulation-${randomUUID()}`,
      from: String(body.whatsapp_id).slice(0, 64),
      displayName: body.name ? String(body.name).slice(0, 120) : null,
      text: String(body.message).slice(0, 4096),
    },
    { source: 'simulation', config },
  )

  return NextResponse.json(result)
}
