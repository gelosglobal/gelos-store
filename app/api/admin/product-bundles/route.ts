import { NextResponse } from 'next/server'
import {
  createProductBundle,
  listProductBundles,
} from '@/lib/db/product-bundles'
import { isAdminDatabaseReady } from '@/lib/db/admin-products'
import { productBundleInputSchema } from '@/lib/admin/product-bundle-input'
import { revalidateStorefront } from '@/lib/revalidate-storefront'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const bundles = await listProductBundles({ activeOnly: false })
    return NextResponse.json({
      bundles,
      databaseConnected: isAdminDatabaseReady(),
    })
  } catch (error) {
    console.error('[GET /api/admin/product-bundles]', error)
    return NextResponse.json(
      { error: 'Failed to load bundles' },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  if (!isAdminDatabaseReady()) {
    return NextResponse.json(
      { error: 'Database is not connected.' },
      { status: 503 },
    )
  }

  try {
    const json = await request.json()
    const parsed = productBundleInputSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid bundle' },
        { status: 400 },
      )
    }

    const bundle = await createProductBundle(parsed.data)
    revalidateStorefront()
    return NextResponse.json({ bundle }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/admin/product-bundles]', error)
    return NextResponse.json(
      { error: 'Failed to create bundle' },
      { status: 500 },
    )
  }
}
