import { NextResponse } from 'next/server'
import { z } from 'zod'
import { reorderProductBundles } from '@/lib/db/product-bundles'
import { isAdminDatabaseReady } from '@/lib/db/admin-products'
import { revalidateStorefront } from '@/lib/revalidate-storefront'

export const dynamic = 'force-dynamic'

const reorderSchema = z.object({
  bundleIds: z.array(z.string().min(1)).min(1),
})

export async function POST(request: Request) {
  if (!isAdminDatabaseReady()) {
    return NextResponse.json(
      { error: 'Database is not connected.' },
      { status: 503 },
    )
  }

  try {
    const json = await request.json()
    const parsed = reorderSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid order' },
        { status: 400 },
      )
    }

    const bundles = await reorderProductBundles(parsed.data.bundleIds)
    revalidateStorefront()
    return NextResponse.json({ bundles })
  } catch (error) {
    console.error('[POST /api/admin/product-bundles/reorder]', error)
    return NextResponse.json(
      { error: 'Failed to reorder bundles' },
      { status: 500 },
    )
  }
}
