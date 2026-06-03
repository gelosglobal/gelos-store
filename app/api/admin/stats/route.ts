import { NextResponse } from 'next/server'
import {
  getAdminDashboardStats,
  isAdminDatabaseReady,
} from '@/lib/db/admin-products'
import { orders, customers } from '@/lib/mock-data'

export async function GET() {
  try {
    const catalog = await getAdminDashboardStats()
    return NextResponse.json({
      ...catalog,
      totalOrders: orders.length,
      totalCustomers: customers.length,
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
