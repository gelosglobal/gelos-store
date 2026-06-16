import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminDatabaseReady } from '@/lib/db/admin-products'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (!isAdminDatabaseReady()) {
    return NextResponse.json(
      { error: 'Database is not connected.' },
      { status: 503 },
    )
  }

  try {
    const json = (await request.json().catch(() => ({}))) as {
      scope?: 'import' | 'all'
    }

    const scope = json.scope ?? 'import'
    const where = scope === 'all' ? {} : { source: 'import' }

    const result = await prisma.customer.deleteMany({ where })

    return NextResponse.json({ deleted: result.count })
  } catch (error) {
    console.error('[POST /api/admin/customers/reset]', error)
    return NextResponse.json(
      { error: 'Failed to reset customers' },
      { status: 500 },
    )
  }
}

