import { NextResponse } from 'next/server'
import { getAdminOrderById, updateAdminOrder } from '@/lib/db/admin-orders'
import { isAdminDatabaseReady } from '@/lib/db/admin-products'
import type { FulfillmentStatus, PaymentStatus } from '@/lib/types/order'

type RouteContext = {
  params: Promise<{ id: string }>
}

const paymentStatuses: PaymentStatus[] = [
  'Paid',
  'Payment pending',
  'Partially paid',
  'Refunded',
  'Voided',
]
const fulfillmentStatuses: FulfillmentStatus[] = [
  'Unfulfilled',
  'Processing',
  'Fulfilled',
  'Shipped',
  'Delivered',
]

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params

    if (!isAdminDatabaseReady()) {
      return NextResponse.json(
        { error: 'Database not connected' },
        { status: 503 },
      )
    }

    const order = await getAdminOrderById(id)
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error('[GET /api/admin/orders/[id]]', error)
    return NextResponse.json(
      { error: 'Failed to load order' },
      { status: 500 },
    )
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params

    if (!isAdminDatabaseReady()) {
      return NextResponse.json(
        { error: 'Database not connected' },
        { status: 503 },
      )
    }

    const body = (await request.json()) as {
      paymentStatus?: PaymentStatus
      fulfillmentStatus?: FulfillmentStatus
    }

    if (
      body.paymentStatus &&
      !paymentStatuses.includes(body.paymentStatus)
    ) {
      return NextResponse.json(
        { error: 'Invalid payment status' },
        { status: 400 },
      )
    }

    if (
      body.fulfillmentStatus &&
      !fulfillmentStatuses.includes(body.fulfillmentStatus)
    ) {
      return NextResponse.json(
        { error: 'Invalid fulfillment status' },
        { status: 400 },
      )
    }

    const order = await updateAdminOrder(id, body)
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error('[PATCH /api/admin/orders/[id]]', error)
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 },
    )
  }
}
