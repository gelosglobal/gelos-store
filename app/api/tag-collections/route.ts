import { NextResponse } from 'next/server'
import { getAllTagCollectionOrders } from '@/lib/db/tag-collections'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const tagCollections = await getAllTagCollectionOrders()
    return NextResponse.json(
      { tagCollections },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } },
    )
  } catch (error) {
    console.error('[GET /api/tag-collections]', error)
    return NextResponse.json(
      { error: 'Failed to load tag collections' },
      { status: 500 },
    )
  }
}
