import { NextResponse } from 'next/server'
import { getAllProducts } from '@/lib/db/products'
import { getAllTagCollectionOrders } from '@/lib/db/tag-collections'
import { listProductBundles } from '@/lib/db/product-bundles'
import { isDatabaseConfigured } from '@/lib/env'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [products, tagCollections, productBundles] = await Promise.all([
      getAllProducts(),
      getAllTagCollectionOrders(),
      listProductBundles({ activeOnly: true }),
    ])
    return NextResponse.json(
      { products, tagCollections, productBundles, databaseConnected: isDatabaseConfigured() },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      },
    )
  } catch (error) {
    console.error('[GET /api/products]', error)
    return NextResponse.json(
      { error: 'Failed to load products' },
      { status: 500 },
    )
  }
}
