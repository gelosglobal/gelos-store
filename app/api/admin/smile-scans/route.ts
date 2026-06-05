import { NextResponse } from 'next/server'
import { listAdminSmileScans } from '@/lib/db/admin-smile-scans'
import { isDatabaseConfigured } from '@/lib/env'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const scans = await listAdminSmileScans()
    return NextResponse.json(
      {
        scans,
        databaseConnected: isDatabaseConfigured(),
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      },
    )
  } catch (error) {
    console.error('[GET /api/admin/smile-scans]', error)
    return NextResponse.json(
      { error: 'Failed to load smile scans' },
      { status: 500 },
    )
  }
}
