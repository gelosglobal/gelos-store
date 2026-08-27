import { NextResponse } from 'next/server'
import { isAdminDatabaseReady } from '@/lib/db/admin-products'
import { prisma } from '@/lib/prisma'
import { refreshOrderDhlTracking } from '@/lib/dhl/fulfill-order'
import { getAdminOrderById } from '@/lib/db/admin-orders'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, context: RouteContext) {
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

    await refreshOrderDhlTracking(order)
    const detail = await getAdminOrderById(id)
    return NextResponse.json({ ok: true, order: detail })
  } catch (error) {
    console.error('[GET /api/admin/orders/[id]/dhl/tracking]', error)
    const message =
      error instanceof Error ? error.message : 'Failed to load DHL tracking'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
