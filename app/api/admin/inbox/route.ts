import { NextResponse } from 'next/server'
import { isAdminDatabaseReady } from '@/lib/db/admin-products'
import { listInboxThreads } from '@/lib/db/inbox'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!isAdminDatabaseReady()) {
    return NextResponse.json(
      { error: 'Database is not connected.' },
      { status: 503 },
    )
  }

  try {
    const threads = await listInboxThreads()
    return NextResponse.json({ threads })
  } catch (error) {
    console.error('[GET /api/admin/inbox]', error)
    return NextResponse.json(
      { error: 'Failed to load inbox' },
      { status: 500 },
    )
  }
}

