import { NextResponse } from 'next/server'
import { isAdminDatabaseReady } from '@/lib/db/admin-products'
import { prisma } from '@/lib/prisma'
import { fulfillOrderWithDhl } from '@/lib/dhl/fulfill-order'
import { getAdminOrderById } from '@/lib/db/admin-orders'
import { isDhlShippingConfigured } from '@/lib/dhl/config'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params

    if (!isAdminDatabaseReady()) {
      return NextResponse.json(
        { error: 'Database not connected' },
        { status: 503 },
      )
    }

    if (!isDhlShippingConfigured()) {
      return NextResponse.json(
        {
          error:
            'DHL shipping is not fully configured. Add DHL_SHIPPER_ADDRESS_LINE1, DHL_SHIPPER_NAME, and DHL_SHIPPER_PHONE.',
        },
        { status: 503 },
      )
    }

    const order = await prisma.order.findUnique({ where: { id } })
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const result = await fulfillOrderWithDhl(order)
    const detail = await getAdminOrderById(id)

    return NextResponse.json({
      ok: true,
      order: detail,
      trackingNumber: result.dhl.trackingNumber,
      pickupError: result.pickupError,
    })
  } catch (error) {
    console.error('[POST /api/admin/orders/[id]/dhl/ship]', error)
    const message =
      error instanceof Error ? error.message : 'Failed to create DHL shipment'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
