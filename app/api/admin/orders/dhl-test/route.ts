import { NextResponse } from 'next/server'
import { isAdminDatabaseReady } from '@/lib/db/admin-products'
import { createDhlTestOrder } from '@/lib/db/create-dhl-test-order'

export const dynamic = 'force-dynamic'

export async function POST() {
  if (!isAdminDatabaseReady()) {
    return NextResponse.json(
      { error: 'Database is not connected.' },
      { status: 503 },
    )
  }

  try {
    const order = await createDhlTestOrder()
    return NextResponse.json({ ok: true, order })
  } catch (error) {
    console.error('[POST /api/admin/orders/dhl-test]', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create DHL test order',
      },
      { status: 500 },
    )
  }
}
