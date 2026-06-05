import { NextResponse } from 'next/server'
import type { AnalyticsPeriod } from '@/lib/admin/analytics-types'
import { getAdminAnalytics } from '@/lib/db/admin-analytics'
import { isAdminDatabaseReady } from '@/lib/db/admin-products'

const PERIODS: AnalyticsPeriod[] = ['today', 'last7', 'last30']

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const periodParam = searchParams.get('period') ?? 'today'
    const period = PERIODS.includes(periodParam as AnalyticsPeriod)
      ? (periodParam as AnalyticsPeriod)
      : 'today'

    const analytics = await getAdminAnalytics(period)

    return NextResponse.json({
      ...analytics,
      period,
      databaseConnected: isAdminDatabaseReady(),
    })
  } catch (error) {
    console.error('[GET /api/admin/analytics]', error)
    return NextResponse.json(
      { error: 'Failed to load analytics' },
      { status: 500 },
    )
  }
}
