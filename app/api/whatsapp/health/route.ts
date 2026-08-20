import { NextResponse } from 'next/server'
import {
  getWhatsappAgentConfig,
  getWhatsappAgentReadiness,
} from '@/lib/whatsapp-agent/config'
import { getWhatsappCatalog } from '@/lib/whatsapp-agent/catalog'

export const runtime = 'nodejs'

export async function GET() {
  const config = getWhatsappAgentConfig()
  const readiness = getWhatsappAgentReadiness(config)
  const catalog = getWhatsappCatalog().completeness()

  return NextResponse.json({
    status: readiness.whatsappLive ? 'ready' : 'setup_required',
    service: 'gelos-whatsapp-order-agent',
    host: 'vercel',
    webhookPath: '/api/whatsapp/webhook',
    readiness,
    catalog,
    timestamp: new Date().toISOString(),
  })
}
