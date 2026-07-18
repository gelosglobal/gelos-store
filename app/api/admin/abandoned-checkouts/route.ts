import { NextResponse } from 'next/server'
import { getAdminAbandonedCheckouts } from '@/lib/db/abandoned-checkouts'
import { isAdminDatabaseReady } from '@/lib/db/admin-products'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!isAdminDatabaseReady()) {
    return NextResponse.json(
      { error: 'Database is not connected.' },
      { status: 503 },
    )
  }

  try {
    const payload = await getAdminAbandonedCheckouts()
    return NextResponse.json(payload)
  } catch (error) {
    console.error('[GET /api/admin/abandoned-checkouts]', error)
    return NextResponse.json(
      { error: 'Failed to load abandoned checkouts' },
      { status: 500 },
    )
  }
}
