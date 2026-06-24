import { NextResponse } from 'next/server'
import { getLiveVisitors } from '@/lib/db/visitor-sessions'
import { isAdminDatabaseReady } from '@/lib/db/admin-products'

export async function GET() {
  try {
    const live = await getLiveVisitors()

    return NextResponse.json({
      ...live,
      databaseConnected: isAdminDatabaseReady(),
    })
  } catch (error) {
    console.error('[GET /api/admin/analytics/live-visitors]', error)
    return NextResponse.json(
      { error: 'Failed to load live visitors' },
      { status: 500 },
    )
  }
}
