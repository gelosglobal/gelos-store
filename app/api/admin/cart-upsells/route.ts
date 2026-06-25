import { NextResponse } from 'next/server'
import { isAdminDatabaseReady } from '@/lib/db/admin-products'
import {
  getCartUpsellSettings,
  updateCartUpsellSettings,
} from '@/lib/db/store-settings'
import { sanitizeCartUpsellSettings } from '@/lib/cart-upsell-settings'

export async function GET() {
  try {
    const settings = await getCartUpsellSettings()
    return NextResponse.json({
      settings,
      databaseConnected: isAdminDatabaseReady(),
    })
  } catch (error) {
    console.error('[GET /api/admin/cart-upsells]', error)
    return NextResponse.json(
      { error: 'Failed to load cart upsell settings' },
      { status: 500 },
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const settings = await updateCartUpsellSettings(
      sanitizeCartUpsellSettings(body),
    )

    return NextResponse.json({
      settings,
      databaseConnected: isAdminDatabaseReady(),
    })
  } catch (error) {
    console.error('[PATCH /api/admin/cart-upsells]', error)
    return NextResponse.json(
      { error: 'Failed to save cart upsell settings' },
      { status: 500 },
    )
  }
}
