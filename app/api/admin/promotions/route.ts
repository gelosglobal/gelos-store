import { NextResponse } from 'next/server'
import { isAdminDatabaseReady } from '@/lib/db/admin-products'
import {
  getStorePromotions,
  updateStorePromotions,
} from '@/lib/db/store-settings'
import { sanitizeStorePromotions } from '@/lib/store-promotions'

export async function GET() {
  try {
    const promotions = await getStorePromotions()
    return NextResponse.json({
      promotions,
      databaseConnected: isAdminDatabaseReady(),
    })
  } catch (error) {
    console.error('[GET /api/admin/promotions]', error)
    return NextResponse.json(
      { error: 'Failed to load promotions settings' },
      { status: 500 },
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const promotions = await updateStorePromotions(
      sanitizeStorePromotions(body),
    )

    return NextResponse.json({
      promotions,
      databaseConnected: isAdminDatabaseReady(),
    })
  } catch (error) {
    console.error('[PATCH /api/admin/promotions]', error)
    return NextResponse.json(
      { error: 'Failed to save promotions settings' },
      { status: 500 },
    )
  }
}
