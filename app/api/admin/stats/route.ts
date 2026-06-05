import { NextResponse } from 'next/server'
import { countAdminCustomers } from '@/lib/db/admin-customers'
import { countAdminOrders } from '@/lib/db/admin-orders'
import {
  getAdminDashboardStats,
  isAdminDatabaseReady,
} from '@/lib/db/admin-products'

export async function GET() {
  try {
    const [catalog, totalOrders, totalCustomers] = await Promise.all([
      getAdminDashboardStats(),
      countAdminOrders(),
      countAdminCustomers(),
    ])
    return NextResponse.json({
      ...catalog,
      totalOrders,
      totalCustomers,
      databaseConnected: isAdminDatabaseReady(),
    })
  } catch (error) {
    console.error('[GET /api/admin/stats]', error)
    return NextResponse.json(
      { error: 'Failed to load stats' },
      { status: 500 },
    )
  }
}
