import { NextResponse } from 'next/server'
import { adminOrderToEmailData } from '@/lib/email/order-email-data'
import { sendOrderInvoiceEmail } from '@/lib/email/send-order-emails'
import { isResendConfigured } from '@/lib/env'
import { getAdminOrderById } from '@/lib/db/admin-orders'
import { isAdminDatabaseReady } from '@/lib/db/admin-products'

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

    if (!isResendConfigured()) {
      return NextResponse.json(
        { error: 'Email is not configured' },
        { status: 503 },
      )
    }

    const order = await getAdminOrderById(id)
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const result = await sendOrderInvoiceEmail(adminOrderToEmailData(order))
    if (!result.sent) {
      if (result.reason === 'missing_customer_email') {
        return NextResponse.json(
          { error: 'Customer email is missing' },
          { status: 400 },
        )
      }

      return NextResponse.json(
        { error: 'Failed to send invoice' },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[POST /api/admin/orders/[id]/invoice]', error)
    return NextResponse.json(
      { error: 'Failed to send invoice' },
      { status: 500 },
    )
  }
}
