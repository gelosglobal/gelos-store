import { NextResponse } from 'next/server'
import { getStorePromotions } from '@/lib/db/store-settings'

export async function GET() {
  try {
    const promotions = await getStorePromotions()
    return NextResponse.json(promotions)
  } catch (error) {
    console.error('[GET /api/store/promotions]', error)
    return NextResponse.json(
      { error: 'Failed to load promotions' },
      { status: 500 },
    )
  }
}
