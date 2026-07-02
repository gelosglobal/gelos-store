import { NextResponse } from 'next/server'
import {
  deleteProductBundle,
  getProductBundle,
  updateProductBundle,
} from '@/lib/db/product-bundles'
import { isAdminDatabaseReady } from '@/lib/db/admin-products'
import { productBundleInputSchema } from '@/lib/admin/product-bundle-input'
import { revalidateStorefront } from '@/lib/revalidate-storefront'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ bundleId: string }> }

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { bundleId } = await context.params
    const bundle = await getProductBundle(bundleId)

    if (!bundle) {
      return NextResponse.json({ error: 'Bundle not found' }, { status: 404 })
    }

    return NextResponse.json({
      bundle,
      databaseConnected: isAdminDatabaseReady(),
    })
  } catch (error) {
    console.error('[GET /api/admin/product-bundles/[bundleId]]', error)
    return NextResponse.json(
      { error: 'Failed to load bundle' },
      { status: 500 },
    )
  }
}

export async function PUT(request: Request, context: RouteContext) {
  if (!isAdminDatabaseReady()) {
    return NextResponse.json(
      { error: 'Database is not connected.' },
      { status: 503 },
    )
  }

  try {
    const { bundleId } = await context.params
    const json = await request.json()
    const parsed = productBundleInputSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid bundle' },
        { status: 400 },
      )
    }

    const bundle = await updateProductBundle(bundleId, parsed.data)
    revalidateStorefront()
    return NextResponse.json({ bundle })
  } catch (error) {
    if (error instanceof Error && error.message === 'BUNDLE_NOT_FOUND') {
      return NextResponse.json({ error: 'Bundle not found' }, { status: 404 })
    }

    console.error('[PUT /api/admin/product-bundles/[bundleId]]', error)
    return NextResponse.json(
      { error: 'Failed to save bundle' },
      { status: 500 },
    )
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  if (!isAdminDatabaseReady()) {
    return NextResponse.json(
      { error: 'Database is not connected.' },
      { status: 503 },
    )
  }

  try {
    const { bundleId } = await context.params
    await deleteProductBundle(bundleId)
    revalidateStorefront()
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'BUNDLE_NOT_FOUND') {
      return NextResponse.json({ error: 'Bundle not found' }, { status: 404 })
    }

    console.error('[DELETE /api/admin/product-bundles/[bundleId]]', error)
    return NextResponse.json(
      { error: 'Failed to delete bundle' },
      { status: 500 },
    )
  }
}
