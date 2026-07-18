import { NextResponse } from 'next/server'
import { isAdminDatabaseReady } from '@/lib/db/admin-products'
import {
  getAllMarketSettings,
  updateAllMarketSettings,
  updateMarketSettings,
} from '@/lib/db/market-settings'
import { loadMarketExchangeRates } from '@/lib/db/market-exchange-rates'
import { setRuntimeExchangeRates } from '@/lib/exchange-rates'
import {
  marketRatesToCurrencyMap,
  sanitizeAllMarketSettings,
  sanitizeMarketSettings,
  type MarketSettings,
} from '@/lib/market-settings'
import type { LocationId } from '@/lib/locations'
import { locations } from '@/lib/locations'

const LOCATION_IDS = new Set(locations.map((loc) => loc.id))

export async function GET() {
  try {
    const markets = await getAllMarketSettings()
    const rates = marketRatesToCurrencyMap(markets)
    setRuntimeExchangeRates(rates)
    await loadMarketExchangeRates(markets)

    return NextResponse.json({
      markets,
      databaseConnected: isAdminDatabaseReady(),
    })
  } catch (error) {
    console.error('[GET /api/admin/markets]', error)
    return NextResponse.json(
      { error: 'Failed to load market settings' },
      { status: 500 },
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()

    let markets
    if (body?.locationId && LOCATION_IDS.has(body.locationId)) {
      const locationId = body.locationId as LocationId
      const patch = (body.market ?? body) as Partial<MarketSettings>
      markets = await updateMarketSettings(
        locationId,
        sanitizeMarketSettings(locationId, patch),
      )
    } else {
      markets = await updateAllMarketSettings(sanitizeAllMarketSettings(body?.markets ?? body))
    }

    const rates = marketRatesToCurrencyMap(markets)
    setRuntimeExchangeRates(rates)
    await loadMarketExchangeRates(markets)

    return NextResponse.json({
      markets,
      databaseConnected: isAdminDatabaseReady(),
    })
  } catch (error) {
    console.error('[PATCH /api/admin/markets]', error)
    return NextResponse.json(
      { error: 'Failed to save market settings' },
      { status: 500 },
    )
  }
}
