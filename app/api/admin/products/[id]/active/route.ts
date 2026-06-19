import { NextResponse } from 'next/server'
import {
  isAdminDatabaseReady,
  setAdminProductActive,
} from '@/lib/db/admin-products'
import { getProductSlug } from '@/lib/product-utils'
import { revalidateStorefront } from '@/lib/revalidate-storefront'

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, context: RouteContext) {
  try {
    if (!isAdminDatabaseReady()) {
      return NextResponse.json(
        { error: 'Database not connected. Changes cannot be saved.' },
        { status: 503 },
      )
    }

    const { id } = await context.params
    const body = (await request.json()) as { active?: boolean }

    if (typeof body.active !== 'boolean') {
      return NextResponse.json(
        { error: 'active must be a boolean' },
        { status: 400 },
      )
    }

    const product = await setAdminProductActive(id, body.active)

    revalidateStorefront(getProductSlug(product))

    return NextResponse.json({ product })
  } catch (error) {
    console.error('[PATCH /api/admin/products/[id]/active]', error)
    return NextResponse.json(
      { error: 'Failed to update product status' },
      { status: 500 },
    )
  }
}
