import { NextResponse } from 'next/server'
import { getSessionsAnalytics } from '@/lib/db/admin-sessions'
import { isAdminDatabaseReady } from '@/lib/db/admin-products'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  if (!isAdminDatabaseReady()) {
    return NextResponse.json(
      { error: 'Database is not connected.' },
      { status: 503 },
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate') ?? undefined
    const endDate = searchParams.get('endDate') ?? undefined
    const startTime = searchParams.get('startTime') ?? undefined
    const endTime = searchParams.get('endTime') ?? undefined
    const comparisonStartDate =
      searchParams.get('comparisonStartDate') ?? undefined
    const comparisonEndDate = searchParams.get('comparisonEndDate') ?? undefined

    const payload = await getSessionsAnalytics({
      range: { startDate, endDate, startTime, endTime },
      comparisonRange: {
        startDate: comparisonStartDate,
        endDate: comparisonEndDate,
      },
    })

    return NextResponse.json(payload)
  } catch (error) {
    console.error('[GET /api/admin/sessions]', error)
    return NextResponse.json(
      { error: 'Failed to load sessions analytics' },
      { status: 500 },
    )
  }
}
