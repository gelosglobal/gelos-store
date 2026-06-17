import { NextResponse } from 'next/server'
import type { AdminProductInput } from '@/lib/admin/types'
import {
  createAdminProduct,
  isAdminDatabaseReady,
  listAdminProducts,
} from '@/lib/db/admin-products'
import { getProductSlug } from '@/lib/product-utils'
import { revalidateStorefront } from '@/lib/revalidate-storefront'

export async function GET() {
  try {
    const products = await listAdminProducts()
    return NextResponse.json({
      products,
      databaseConnected: isAdminDatabaseReady(),
    })
  } catch (error) {
    console.error('[GET /api/admin/products]', error)
    return NextResponse.json(
      { error: 'Failed to load products' },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    if (!isAdminDatabaseReady()) {
      return NextResponse.json(
        {
          error:
            'Database not connected. Set DATABASE_URL in .env.local and run pnpm db:push && pnpm db:seed.',
        },
        { status: 503 },
      )
    }

    const body = (await request.json()) as AdminProductInput
    if (!body.name?.trim() || !body.category) {
      return NextResponse.json(
        { error: 'Name and category are required' },
        { status: 400 },
      )
    }

    const product = await createAdminProduct({
      name: body.name,
      category: body.category,
      price: Number(body.price) || 0,
      stock: Number(body.stock) || 0,
      description: body.description ?? '',
      image: body.image ?? '/placeholder.svg',
      rating: Number(body.rating) || 4.8,
      reviews: Number(body.reviews) || 0,
      tags: body.tags,
      variantImageOptions: body.variantImageOptions,
      variantImages: body.variantImages,
      galleryImages: body.galleryImages,
    })

    revalidateStorefront(getProductSlug(product))

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/admin/products]', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 },
    )
  }
}
