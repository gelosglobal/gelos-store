import { NextResponse } from 'next/server'
import { isAdminDatabaseReady } from '@/lib/db/admin-products'
import { prisma } from '@/lib/prisma'
import {
  cancelOrderDhlPickup,
  requestOrderDhlPickup,
} from '@/lib/dhl/fulfill-order'
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

    const record = await requestOrderDhlPickup(order)
    const detail = await getAdminOrderById(id)

    return NextResponse.json({
      ok: true,
      order: detail,
      pickupConfirmationNumber: record.pickupConfirmationNumber,
    })
  } catch (error) {
    console.error('[POST /api/admin/orders/[id]/dhl/pickup]', error)
    const message =
      error instanceof Error ? error.message : 'Failed to request DHL pickup'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params

    if (!isAdminDatabaseReady()) {
      return NextResponse.json(
        { error: 'Database not connected' },
        { status: 503 },
      )
    }

    const order = await prisma.order.findUnique({ where: { id } })
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const url = new URL(request.url)
    await cancelOrderDhlPickup(order, {
      requestorName: url.searchParams.get('requestorName') ?? undefined,
      reason: url.searchParams.get('reason') ?? undefined,
    })
    const detail = await getAdminOrderById(id)

    return NextResponse.json({ ok: true, order: detail })
  } catch (error) {
    console.error('[DELETE /api/admin/orders/[id]/dhl/pickup]', error)
    const message =
      error instanceof Error ? error.message : 'Failed to cancel DHL pickup'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
