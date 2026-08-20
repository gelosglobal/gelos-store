import { NextRequest, NextResponse } from 'next/server'
import { getWhatsappAgentConfig } from '@/lib/whatsapp-agent/config'
import { listOrders } from '@/lib/whatsapp-agent/store'

export const runtime = 'nodejs'

function authorizeAdmin(request: NextRequest, token: string) {
  if (!token) return false
  const authorization = request.headers.get('authorization') || ''
  const bearer = authorization.startsWith('Bearer ')
    ? authorization.slice(7)
    : ''
  return bearer === token
}

export async function GET(request: NextRequest) {
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

  const limit = Number.parseInt(
    request.nextUrl.searchParams.get('limit') || '100',
    10,
  )
  const orders = await listOrders(Number.isFinite(limit) ? limit : 100)
  return NextResponse.json({ orders })
}
