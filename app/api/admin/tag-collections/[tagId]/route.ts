import { NextResponse } from 'next/server'
import {
  getTagCollectionOrder,
  saveTagCollectionOrder,
} from '@/lib/db/tag-collections'
import { isAdminDatabaseReady } from '@/lib/db/admin-products'
import {
  productTagDefinitions,
  type ProductTagId,
} from '@/lib/product-tags'
import { revalidateStorefront } from '@/lib/revalidate-storefront'

type RouteContext = { params: Promise<{ tagId: string }> }

const validTagIds = new Set(productTagDefinitions.map((t) => t.id))

function parseTagId(raw: string): ProductTagId | null {
  return validTagIds.has(raw as ProductTagId) ? (raw as ProductTagId) : null
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { tagId: raw } = await context.params
    const tagId = parseTagId(raw)
    if (!tagId) {
      return NextResponse.json({ error: 'Invalid collection' }, { status: 400 })
    }

    const productIds = await getTagCollectionOrder(tagId)
    return NextResponse.json({
      tagId,
      productIds,
      databaseConnected: isAdminDatabaseReady(),
    })
  } catch (error) {
    console.error('[GET /api/admin/tag-collections/[tagId]]', error)
    return NextResponse.json(
      { error: 'Failed to load collection' },
      { status: 500 },
    )
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    if (!isAdminDatabaseReady()) {
      return NextResponse.json(
        { error: 'Database not connected. Changes cannot be saved.' },
        { status: 503 },
      )
    }

    const { tagId: raw } = await context.params
    const tagId = parseTagId(raw)
    if (!tagId) {
      return NextResponse.json({ error: 'Invalid collection' }, { status: 400 })
    }

    const body = (await request.json()) as { productIds?: string[] }
    const productIds = Array.isArray(body.productIds) ? body.productIds : []

    const saved = await saveTagCollectionOrder(tagId, productIds)
    revalidateStorefront()

    return NextResponse.json({ tagId, productIds: saved })
  } catch (error) {
    console.error('[PUT /api/admin/tag-collections/[tagId]]', error)
    return NextResponse.json(
      { error: 'Failed to save collection order' },
      { status: 500 },
    )
  }
}
