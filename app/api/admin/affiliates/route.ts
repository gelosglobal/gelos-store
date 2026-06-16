import { NextResponse } from 'next/server'
import { adminAffiliateInputSchema } from '@/lib/admin/affiliate-input'
import {
  getAffiliateDashboardStats,
  listAdminAffiliates,
} from '@/lib/db/admin-affiliates'
import { createStoredAffiliate } from '@/lib/db/affiliates'
import { isAdminDatabaseReady } from '@/lib/db/admin-products'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [affiliates, stats] = await Promise.all([
      listAdminAffiliates(),
      getAffiliateDashboardStats(),
    ])

    return NextResponse.json({
      affiliates,
      stats,
      databaseConnected: isAdminDatabaseReady(),
    })
  } catch (error) {
    console.error('[GET /api/admin/affiliates]', error)
    return NextResponse.json(
      { error: 'Failed to load affiliates' },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  if (!isAdminDatabaseReady()) {
    return NextResponse.json(
      { error: 'Database is not connected.' },
      { status: 503 },
    )
  }

  try {
    const json = await request.json()
    const parsed = adminAffiliateInputSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid affiliate' },
        { status: 400 },
      )
    }

    const affiliate = await createStoredAffiliate(parsed.data)
    return NextResponse.json({ affiliate }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'AFFILIATE_CODE_EXISTS') {
      return NextResponse.json(
        { error: 'An affiliate with this code already exists.' },
        { status: 409 },
      )
    }

    console.error('[POST /api/admin/affiliates]', error)
    return NextResponse.json(
      { error: 'Failed to create affiliate' },
      { status: 500 },
    )
  }
}
