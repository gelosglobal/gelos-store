import { NextResponse } from 'next/server'
import { getAllMarketSettings } from '@/lib/db/market-settings'
import { resolveGeoMarketFromRequest } from '@/lib/geo-market'
import { fetchUsdToLocalRates } from '@/lib/fx-live'
import {
  applyUsdPivotRates,
  setLiveUsdToLocalRates,
  setLockedExchangeCurrencies,
  setRuntimeExchangeRates,
} from '@/lib/exchange-rates'
import {
  lockedMarketCurrencies,
  marketRatesToCurrencyMap,
} from '@/lib/market-settings'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const [geo, markets, usdToLocal] = await Promise.all([
      resolveGeoMarketFromRequest(request.headers),
      getAllMarketSettings(),
      fetchUsdToLocalRates(),
    ])

    const locked = lockedMarketCurrencies(markets)
    const marketRates = marketRatesToCurrencyMap(markets)
    setLockedExchangeCurrencies(locked)
    setLiveUsdToLocalRates(usdToLocal)
    const rates = applyUsdPivotRates(marketRates, usdToLocal, locked)
    setRuntimeExchangeRates(rates)

    return NextResponse.json(
      { ...geo, rates, usdToLocal, lockedCurrencies: locked },
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
