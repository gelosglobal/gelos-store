import { NextResponse } from 'next/server'
import { isAdminDatabaseReady } from '@/lib/db/admin-products'
import { sendWhatsappPaymentLink } from '@/lib/whatsapp-agent/admin'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ whatsappId: string }> }

export async function POST(_request: Request, context: RouteContext) {
  if (!isAdminDatabaseReady()) {
    return NextResponse.json(
      { error: 'Database is not connected.' },
      { status: 503 },
    )
  }

  try {
    const { whatsappId } = await context.params
    const result = await sendWhatsappPaymentLink(
      decodeURIComponent(whatsappId),
    )
    return NextResponse.json(result)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to send payment link'
    console.error(
      '[POST /api/admin/whatsapp/[whatsappId]/payment-link]',
      error,
    )
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
