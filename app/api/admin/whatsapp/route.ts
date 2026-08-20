import { NextResponse } from 'next/server'
import { isAdminDatabaseReady } from '@/lib/db/admin-products'
import { listWhatsappAdminThreads } from '@/lib/whatsapp-agent/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!isAdminDatabaseReady()) {
    return NextResponse.json(
      { error: 'Database is not connected.' },
      { status: 503 },
    )
  }

  try {
    const threads = await listWhatsappAdminThreads()
    return NextResponse.json({ threads })
  } catch (error) {
    console.error('[GET /api/admin/whatsapp]', error)
    return NextResponse.json(
      { error: 'Failed to load WhatsApp threads' },
      { status: 500 },
    )
  }
}
