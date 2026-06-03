'use client'

import Image from 'next/image'
import Link from 'next/link'
import { getProductHref, getProductSlug } from '@/lib/product-utils'
import type { Product } from '@/lib/types/product'
import { cn } from '@/lib/utils'

type ProductFlavorPickerProps = {
  products: Product[]
  currentProduct: Product
}

export function ProductFlavorPicker({
  products,
  currentProduct,
}: ProductFlavorPickerProps) {
  if (products.length <= 1) return null

  const currentSlug = getProductSlug(currentProduct)

  return (
    <div className="flex flex-wrap gap-2.5 pt-2">
      {products.map((variant) => {
        const slug = getProductSlug(variant)
        const isActive = slug === currentSlug
        return (
          <Link
            key={variant.id}
            href={getProductHref(variant)}
            title={variant.name}
            className={cn(
              'relative h-11 w-11 overflow-hidden rounded-lg bg-white ring-2 transition-all sm:h-12 sm:w-12',
              isActive
                ? 'ring-neutral-950'
                : 'ring-neutral-200 hover:ring-neutral-400',
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            <Image
              src={variant.image}
              alt={variant.name}
              fill
              className="object-contain p-1"
              sizes="48px"
            />
          </Link>
        )
      })}
    </div>
  )
}
