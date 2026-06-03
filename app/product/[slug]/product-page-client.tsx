'use client'

import { useProducts } from '@/components/products-provider'
import { ProductCatalogPage } from '@/components/product-catalog-page'
import type { Product } from '@/lib/types/product'

type ProductPageClientProps = {
  product: Product
  variants: Product[]
  communityFavorites: Product[]
}

export function ProductPageClient({
  product: serverProduct,
  variants,
  communityFavorites,
}: ProductPageClientProps) {
  const { getProductById } = useProducts()
  const product = getProductById(serverProduct.id) ?? serverProduct

  return (
    <ProductCatalogPage
      product={product}
      variants={variants}
      communityFavorites={communityFavorites}
    />
  )
}
