import { NextResponse } from 'next/server'
import { listAdminSmileScans } from '@/lib/db/admin-smile-scans'
import { isDatabaseConfigured } from '@/lib/env'

export const dynamic = 'force-dynamic'

export async function GET() {
  const databaseConnected = isDatabaseConfigured()

  try {
    const scans = await listAdminSmileScans()
    return NextResponse.json(
      {
        scans,
        databaseConnected,
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      },
    )
  } catch (error) {
    console.error('[GET /api/admin/smile-scans]', error)
    const message =
      error instanceof Error ? error.message : 'Failed to load smile scans'

    return NextResponse.json(
      {
        error: 'Failed to load smile scans',
        databaseConnected,
        detail:
          process.env.NODE_ENV === 'development'
            ? message
            : 'Redeploy with a fresh build after prisma generate.',
      },
      { status: 500 },
    )
  }
}
