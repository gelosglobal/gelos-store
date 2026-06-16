import { NextResponse } from 'next/server'
import { adminCustomerInputSchema } from '@/lib/admin/customer-input'
import { listAdminCustomers } from '@/lib/db/admin-customers'
import { createStoredCustomer } from '@/lib/db/customers'
import { isAdminDatabaseReady } from '@/lib/db/admin-products'

export const dynamic = 'force-dynamic'

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

export async function POST(request: Request) {
  if (!isAdminDatabaseReady()) {
    return NextResponse.json(
      { error: 'Database is not connected.' },
      { status: 503 },
    )
  }

  try {
    const json = await request.json()
    const parsed = adminCustomerInputSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid customer' },
        { status: 400 },
      )
    }

    const customer = await createStoredCustomer(parsed.data, 'manual')
    return NextResponse.json({ customer }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'CUSTOMER_ALREADY_EXISTS') {
      return NextResponse.json(
        { error: 'A customer with this email or phone already exists.' },
        { status: 409 },
      )
    }

    console.error('[POST /api/admin/customers]', error)
    return NextResponse.json(
      { error: 'Failed to add customer' },
      { status: 500 },
    )
  }
}
