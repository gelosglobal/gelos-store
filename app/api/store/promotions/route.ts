import { NextResponse } from 'next/server'
import { getStorePromotions } from '@/lib/db/store-settings'

export async function GET() {
  try {
    const promotions = await getStorePromotions()
    return NextResponse.json(promotions, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    console.error('[GET /api/store/promotions]', error)
    return NextResponse.json(
      { error: 'Failed to load promotions' },
      { status: 500 },
    )
  }
}
