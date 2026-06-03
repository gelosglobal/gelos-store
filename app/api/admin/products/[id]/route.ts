import { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import type { AdminProductInput } from '@/lib/admin/types'
import {
  deleteAdminProduct,
  isAdminDatabaseReady,
  updateAdminProduct,
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
    const body = (await request.json()) as AdminProductInput

    if (!body.name?.trim() || !body.category) {
      return NextResponse.json(
        { error: 'Name and category are required' },
        { status: 400 },
      )
    }

    const product = await updateAdminProduct(id, {
      name: body.name,
      category: body.category,
      price: Number(body.price) || 0,
      stock: Number(body.stock) || 0,
      description: body.description ?? '',
      image: body.image ?? '/placeholder.svg',
      rating: Number(body.rating) ?? 4.8,
      reviews: Number(body.reviews) ?? 0,
      tags: body.tags,
      variantImages: body.variantImages,
      galleryImages: body.galleryImages,
    })

    revalidateStorefront(getProductSlug(product))

    return NextResponse.json({ product })
  } catch (error) {
    console.error('[PATCH /api/admin/products/[id]]', error)
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'Another product already uses this name (slug conflict).' },
        { status: 409 },
      )
    }
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 },
    )
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    if (!isAdminDatabaseReady()) {
      return NextResponse.json(
        { error: 'Database not connected. Changes cannot be saved.' },
        { status: 503 },
      )
    }

    const { id } = await context.params
    await deleteAdminProduct(id)
    revalidateStorefront()
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[DELETE /api/admin/products/[id]]', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 },
    )
  }
}
