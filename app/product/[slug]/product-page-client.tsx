'use client'

import { useEffect, Suspense } from 'react'
import { useLocation } from '@/components/location-provider'
import { useProducts } from '@/components/products-provider'
import { ProductCatalogPage } from '@/components/product-catalog-page'
import { convertForLocation } from '@/lib/exchange-rates'
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
  const { location, locationId } = useLocation()
  const clientProduct = getProductById(serverProduct.id)
  // Synthetic line parents are server-only — don't let a missing client match wipe variants.
  const product =
    serverProduct.id.startsWith('line:') || !clientProduct
      ? serverProduct
      : {
          ...serverProduct,
          ...clientProduct,
          shopifyPdpContent:
            clientProduct.shopifyPdpContent ?? serverProduct.shopifyPdpContent,
          galleryImages:
            clientProduct.galleryImages?.length > 0
              ? clientProduct.galleryImages
              : serverProduct.galleryImages,
          variantImageOptions:
            clientProduct.variantImageOptions?.length > 0
              ? clientProduct.variantImageOptions
              : serverProduct.variantImageOptions,
          variantImages:
            clientProduct.variantImages?.length > 0
              ? clientProduct.variantImages
              : serverProduct.variantImages,
        }

  useEffect(() => {
    trackViewContent({
      id: product.id,
      name: product.name,
      price: convertForLocation(product.price, locationId),
      category: product.category,
      currency: location.currencyCode,
    })
  }, [
    product.id,
    product.name,
    product.price,
    product.category,
    location.currencyCode,
    locationId,
  ])

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
