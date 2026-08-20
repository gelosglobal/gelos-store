import { NextResponse } from 'next/server'
import { isAdminDatabaseReady } from '@/lib/db/admin-products'
import { listOrders } from '@/lib/whatsapp-agent/store'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!isAdminDatabaseReady()) {
    return NextResponse.json(
      { error: 'Database is not connected.' },
      { status: 503 },
    )
  }

  try {
    const orders = await listOrders(200)
    return NextResponse.json({ orders })
  } catch (error) {
    console.error('[GET /api/admin/whatsapp/orders]', error)
    return NextResponse.json(
      { error: 'Failed to load WhatsApp orders' },
      { status: 500 },
    )
  }
}
