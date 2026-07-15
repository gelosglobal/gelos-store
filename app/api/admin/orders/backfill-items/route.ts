import { NextResponse } from 'next/server'
import { z } from 'zod'
import { backfillOrderItemsFromPaystack } from '@/lib/db/backfill-order-items'
import { isAdminDatabaseReady } from '@/lib/db/admin-products'
import { isPaystackConfigured } from '@/lib/paystack'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  orderId: z.string().trim().min(1).optional(),
})

export async function POST(request: Request) {
  if (!isAdminDatabaseReady()) {
    return NextResponse.json(
      { error: 'Database is not connected.' },
      { status: 503 },
    )
  }

  if (!isPaystackConfigured()) {
    return NextResponse.json(
      { error: 'Paystack is not configured.' },
      { status: 503 },
    )
  }

  try {
    const json = await request.json().catch(() => ({}))
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
    }

    const summary = await backfillOrderItemsFromPaystack({
      orderId: parsed.data.orderId,
    })

    return NextResponse.json({
      ok: true,
      ...summary,
    })
  } catch (error) {
    console.error('[POST /api/admin/orders/backfill-items]', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to backfill order items',
      },
      { status: 500 },
    )
  }
}
