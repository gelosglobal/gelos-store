import { NextResponse } from 'next/server'
import { getAllProducts } from '@/lib/db/products'
import { getAllTagCollectionOrders } from '@/lib/db/tag-collections'
import { listProductBundles } from '@/lib/db/product-bundles'
import { isDatabaseConfigured } from '@/lib/env'

/** Short cache cuts Fluid CPU + Edge Requests; admin mutations still revalidate. */
export const revalidate = 60

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
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
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
