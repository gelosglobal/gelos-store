import { NextResponse } from 'next/server'
import { listAdminCustomers } from '@/lib/db/admin-customers'
import { isAdminDatabaseReady } from '@/lib/db/admin-products'

export async function GET() {
  try {
    const customers = await listAdminCustomers()
    return NextResponse.json({
      customers,
      databaseConnected: isAdminDatabaseReady(),
    })
  } catch (error) {
    console.error('[GET /api/admin/customers]', error)
    return NextResponse.json(
      { error: 'Failed to load customers' },
      { status: 500 },
    )
  }
}
