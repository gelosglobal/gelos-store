import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProductPageClient } from '@/app/product/[slug]/product-page-client'
import {
  getCommunityFavoritesForCategory,
  getVariantsForCategory,
} from '@/lib/product-page-data'
import { getProductBySlugOrId, getAllProducts } from '@/lib/db/products'
import { getProductSlug } from '@/lib/product-utils'

type PageProps = {
  params: Promise<{ slug: string }>
}

export const revalidate = 60

export async function generateStaticParams() {
  const products = await getAllProducts()
  return products.map((product) => ({
    slug: getProductSlug(product),
  }))
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlugOrId(slug)
  if (!product) {
    return { title: 'Product not found | Gelos' }
  }
  return {
    title: `${product.name} | Gelos`,
    description: product.description,
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params
  const product = await getProductBySlugOrId(slug)

  if (!product) {
    notFound()
  }

  const [variants, communityFavorites] = await Promise.all([
    getVariantsForCategory(product.category),
    getCommunityFavoritesForCategory(product.category),
  ])

  return (
    <ProductPageClient
      product={product}
      variants={variants}
      communityFavorites={communityFavorites}
    />
  )
}
