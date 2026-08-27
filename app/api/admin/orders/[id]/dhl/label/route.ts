import { NextResponse } from 'next/server'
import { isAdminDatabaseReady } from '@/lib/db/admin-products'
import { prisma } from '@/lib/prisma'
import { asDhlShipmentRecord } from '@/lib/dhl/record'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, context: RouteContext) {
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

    const dhl = asDhlShipmentRecord(order.dhl)
    const type = new URL(request.url).searchParams.get('type')?.toLowerCase()
    const documents = dhl?.documents ?? []
    const document =
      (type
        ? documents.find((entry) => entry.typeCode.toLowerCase() === type)
        : undefined) ??
      documents.find((entry) => entry.typeCode.toLowerCase() === 'label') ??
      documents[0]

    if (!document?.content) {
      return NextResponse.json(
        { error: 'No DHL label is stored for this order' },
        { status: 404 },
      )
    }

    const bytes = Buffer.from(document.content, 'base64')
    const filename = `${order.orderNumber}-${document.typeCode}.pdf`

    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (error) {
    console.error('[GET /api/admin/orders/[id]/dhl/label]', error)
    const message =
      error instanceof Error ? error.message : 'Failed to load DHL label'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
