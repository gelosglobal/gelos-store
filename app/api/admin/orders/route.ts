import { NextResponse } from 'next/server'
import { isAdminDatabaseReady } from '@/lib/db/admin-products'
import { listAdminOrders } from '@/lib/db/admin-orders'

export async function GET() {
  try {
    const orders = await listAdminOrders()
    return NextResponse.json({
      orders,
      databaseConnected: isAdminDatabaseReady(),
    })
  } catch (error) {
    console.error('[GET /api/admin/orders]', error)
    return NextResponse.json(
      { error: 'Failed to load orders' },
      { status: 500 },
    )
  }
}
