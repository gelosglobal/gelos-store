import { NextRequest, NextResponse } from 'next/server'
import {
  getWhatsappAgentConfig,
  getWhatsappAgentReadiness,
} from '@/lib/whatsapp-agent/config'
import { handleWebhookPayload } from '@/lib/whatsapp-agent/process'
import { verifyWebhookSignature } from '@/lib/whatsapp-agent/whatsapp'

export const runtime = 'nodejs'
export const maxDuration = 60

/** Meta webhook verification challenge. */
export async function GET(request: NextRequest) {
  const config = getWhatsappAgentConfig()
  const mode = request.nextUrl.searchParams.get('hub.mode')
  const token = request.nextUrl.searchParams.get('hub.verify_token')
  const challenge = request.nextUrl.searchParams.get('hub.challenge')

  if (
    mode === 'subscribe' &&
    config.meta.verifyToken &&
    token === config.meta.verifyToken
  ) {
    return new NextResponse(challenge || '', {
      status: 200,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    })
  }

  return new NextResponse('Webhook verification failed.', { status: 403 })
}

/** Meta WhatsApp Cloud API inbound messages. */
export async function POST(request: NextRequest) {
  const config = getWhatsappAgentConfig()
  const rawBody = Buffer.from(await request.arrayBuffer())
  const signature = request.headers.get('x-hub-signature-256')

  if (
    !verifyWebhookSignature(rawBody, signature, config.meta.appSecret)
  ) {
    return NextResponse.json(
      { error: 'Invalid webhook signature.' },
      { status: 401 },
    )
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(rawBody.toString('utf8')) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  // Process inline so Vercel keeps the function alive through OpenAI + send.
  // (Background after()/setImmediate often exits before the reply is sent.)
  try {
    await handleWebhookPayload(payload, config)
  } catch (error) {
    console.error('[whatsapp-agent] webhook_failed', error)
  }

  return NextResponse.json({
    received: true,
    readiness: getWhatsappAgentReadiness(config),
  })
}
