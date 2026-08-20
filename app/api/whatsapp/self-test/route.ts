import { NextRequest, NextResponse } from 'next/server'
import {
  getWhatsappAgentConfig,
  getWhatsappAgentReadiness,
} from '@/lib/whatsapp-agent/config'
import { sendTextMessage } from '@/lib/whatsapp-agent/whatsapp'

export const runtime = 'nodejs'
export const maxDuration = 30

/**
 * Proves the Vercel runtime can send WhatsApp with the env on that deployment.
 * POST with Authorization: Bearer WHATSAPP_AGENT_ADMIN_TOKEN
 * Optional JSON: { "to": "2335..." } — defaults to STAFF_WHATSAPP_NUMBER
 */
export async function POST(request: NextRequest) {
  const config = getWhatsappAgentConfig()
  if (!config.adminApiToken) {
    return NextResponse.json(
      { error: 'WHATSAPP_AGENT_ADMIN_TOKEN is not configured.' },
      { status: 503 },
    )
  }
  const authorization = request.headers.get('authorization') || ''
  const bearer = authorization.startsWith('Bearer ')
    ? authorization.slice(7)
    : ''
  if (bearer !== config.adminApiToken) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  let to = config.meta.staffNumber
  try {
    const body = (await request.json()) as { to?: string }
    if (body?.to) to = String(body.to).replace(/\D/g, '').slice(0, 20)
  } catch {
    // optional body
  }

  if (!to) {
    return NextResponse.json(
      { error: 'No destination. Set STAFF_WHATSAPP_NUMBER or pass { "to": "..." }.' },
      { status: 400 },
    )
  }

  const readiness = getWhatsappAgentReadiness(config)
  try {
    const result = await sendTextMessage(
      to,
      'Gelos Vercel self-test: Cloud API send from this deployment works.',
      config.meta,
    )
    return NextResponse.json({
      ok: true,
      to,
      phoneNumberId: config.meta.phoneNumberId,
      readiness,
      result,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        to,
        phoneNumberId: config.meta.phoneNumberId,
        readiness,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    )
  }
}
