import { NextResponse } from 'next/server'
import { getCartUpsellSettings } from '@/lib/db/store-settings'

export async function GET() {
  try {
    const settings = await getCartUpsellSettings()
    return NextResponse.json(settings)
  } catch (error) {
    console.error('[GET /api/store/cart-upsells]', error)
    return NextResponse.json(
      { error: 'Failed to load cart upsell settings' },
      { status: 500 },
    )
  }
}
