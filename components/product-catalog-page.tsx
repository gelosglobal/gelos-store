'use client'

import type { ReactNode } from 'react'
import { ProductEnhancedPdp } from '@/components/product-enhanced-pdp'
import { ProductCategoryVariantPicker } from '@/components/product-category-variant-picker'
import { ProductMouthwashFlavorPicker } from '@/components/product-mouthwash-flavor-picker'
import { ProductToothbrushStylePicker } from '@/components/product-toothbrush-style-picker'
import { ProductToothpasteFlavorPicker } from '@/components/product-toothpaste-flavor-picker'
import { ProductTongueScraperStylePicker } from '@/components/product-tongue-scraper-style-picker'
import { ProductWellnessFlavorPicker } from '@/components/product-wellness-flavor-picker'
import { ProductWhiteningTreatmentPicker } from '@/components/product-whitening-treatment-picker'
import {
  getCategoryNav,
  getProductPdpContent,
} from '@/lib/product-page-data'
import type { Product } from '@/lib/types/product'

type ProductCatalogPageProps = {
  product: Product
  variants: Product[]
  communityFavorites: Product[]
}

function buildFlavorPicker(
  product: Product,
  variants: Product[],
): ReactNode | undefined {
  if (variants.length <= 1) return undefined

  switch (product.category) {
    case 'Toothpaste':
      return (
        <ProductToothpasteFlavorPicker
          products={variants}
          currentProduct={product}
        />
      )
    case 'Mouthwash':
      return (
        <ProductMouthwashFlavorPicker
          products={variants}
          currentProduct={product}
        />
      )
    case 'Tongue Scraper':
      return (
        <ProductTongueScraperStylePicker
          products={variants}
          currentProduct={product}
        />
      )
    case 'Wellness':
      return (
        <ProductWellnessFlavorPicker
          products={variants}
          currentProduct={product}
        />
      )
    case 'Whitening':
      return (
        <ProductWhiteningTreatmentPicker
          products={variants}
          currentProduct={product}
        />
      )
    case 'Toothbrushes':
      return (
        <ProductToothbrushStylePicker
          products={variants}
          currentProduct={product}
        />
      )
    default:
      return (
        <ProductCategoryVariantPicker
          products={variants}
          currentProduct={product}
        />
      )
  }
}

export function ProductCatalogPage({
  product,
  variants,
  communityFavorites,
}: ProductCatalogPageProps) {
  const { label, shopHref } = getCategoryNav(product.category)

  return (
    <ProductEnhancedPdp
      product={product}
      variants={variants}
      communityFavorites={communityFavorites}
      content={getProductPdpContent(product)}
      categoryLabel={label}
      categoryShopHref={shopHref}
      flavorPicker={buildFlavorPicker(product, variants)}
    />
  )
}
