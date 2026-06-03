import { NextResponse } from 'next/server'
import { getAllProducts } from '@/lib/db/products'
import { getAllTagCollectionOrders } from '@/lib/db/tag-collections'
import { isDatabaseConfigured } from '@/lib/env'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [products, tagCollections] = await Promise.all([
      getAllProducts(),
      getAllTagCollectionOrders(),
    ])
    return NextResponse.json(
      { products, tagCollections, databaseConnected: isDatabaseConfigured() },
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
