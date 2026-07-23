import { NextResponse } from 'next/server'
import { getAllMarketSettings } from '@/lib/db/market-settings'
import { loadMarketExchangeRates } from '@/lib/db/market-exchange-rates'
import { setRuntimeExchangeRates } from '@/lib/exchange-rates'
import { marketRatesToCurrencyMap } from '@/lib/market-settings'

export async function GET() {
  try {
    const markets = await getAllMarketSettings()
    const rates = marketRatesToCurrencyMap(markets)
    setRuntimeExchangeRates(rates)
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
