'use client'

import { useEffect, Suspense } from 'react'
import { useProducts } from '@/components/products-provider'
import { ProductCatalogPage } from '@/components/product-catalog-page'
import { trackViewContent } from '@/lib/meta-pixel'
import type { Product } from '@/lib/types/product'

type ProductPageClientProps = {
  product: Product
  variants: Product[]
  communityFavorites: Product[]
}

function ProductPageClientInner({
  product: serverProduct,
  variants,
  communityFavorites,
}: ProductPageClientProps) {
  const { getProductById } = useProducts()
  const product = getProductById(serverProduct.id) ?? serverProduct

  useEffect(() => {
    trackViewContent({
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
    })
  }, [product.id, product.name, product.price, product.category])

  return (
    <ProductCatalogPage
      product={product}
      variants={variants}
      communityFavorites={communityFavorites}
    />
  )
}

export function ProductPageClient(props: ProductPageClientProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-neutral-500">
          Loading product…
        </div>
      }
    >
      <ProductPageClientInner {...props} />
    </Suspense>
  )
}
