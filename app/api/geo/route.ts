import { NextResponse } from 'next/server'
import { getAllMarketSettings } from '@/lib/db/market-settings'
import { resolveGeoMarketFromRequest } from '@/lib/geo-market'
import { fetchUsdToLocalRates } from '@/lib/fx-live'
import {
  applyUsdPivotRates,
  setLiveUsdToLocalRates,
  setRuntimeExchangeRates,
} from '@/lib/exchange-rates'
import { marketRatesToCurrencyMap } from '@/lib/market-settings'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const [geo, markets, usdToLocal] = await Promise.all([
      resolveGeoMarketFromRequest(request.headers),
      getAllMarketSettings(),
      fetchUsdToLocalRates(),
    ])

    const marketRates = marketRatesToCurrencyMap(markets)
    setLiveUsdToLocalRates(usdToLocal)
    const rates = applyUsdPivotRates(marketRates, usdToLocal)

    return NextResponse.json(
      { ...geo, rates },
      {
        headers: {
          'Cache-Control': 'private, no-store',
        },
      },
    )
  } catch (error) {
    console.error('[GET /api/geo]', error)
    return NextResponse.json(
      { error: 'Failed to resolve location' },
      { status: 500 },
    )
  }
}
