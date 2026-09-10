import { NextResponse } from 'next/server'
import { getAllMarketSettings } from '@/lib/db/market-settings'
import { loadMarketExchangeRates } from '@/lib/db/market-exchange-rates'

export async function GET() {
  try {
    const markets = await getAllMarketSettings()
    await loadMarketExchangeRates(markets)

    return NextResponse.json(
      { markets },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      },
    )
  } catch (error) {
    console.error('[GET /api/store/markets]', error)
    return NextResponse.json(
      { error: 'Failed to load market settings' },
      { status: 500 },
    )
  }
}
