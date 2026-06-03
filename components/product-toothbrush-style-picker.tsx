'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  getToothbrushStyleCover,
  getToothbrushStyleLabel,
  toothbrushStyleOrder,
} from '@/lib/toothbrush-style-covers'
import { getProductHref, getProductSlug } from '@/lib/product-utils'
import type { Product } from '@/lib/types/product'
import { cn } from '@/lib/utils'

type ProductToothbrushStylePickerProps = {
  products: Product[]
  currentProduct: Product
}

export function ProductToothbrushStylePicker({
  products,
  currentProduct,
}: ProductToothbrushStylePickerProps) {
  if (products.length <= 1) return null

  const currentSlug = getProductSlug(currentProduct)
  const orderIndex = new Map(
    toothbrushStyleOrder.map((id, index) => [id, index]),
  )
  const sorted = [...products].sort(
    (a, b) => (orderIndex.get(a.id) ?? 99) - (orderIndex.get(b.id) ?? 99),
  )

  return (
    <div className="pt-3">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500 sm:text-xs">
        Choose your brush
      </p>
      <div className="flex flex-wrap gap-2">
        {sorted.map((variant) => {
          const slug = getProductSlug(variant)
          const isActive = slug === currentSlug
          const coverSrc = getToothbrushStyleCover(variant.id, variant.image)
          const label = getToothbrushStyleLabel(variant.name)

          return (
            <Link
              key={variant.id}
              href={getProductHref(variant)}
              title={variant.name}
              className={cn(
                'group relative h-12 w-10 shrink-0 overflow-hidden rounded-lg bg-neutral-100 transition-all sm:h-14 sm:w-11',
                isActive
                  ? 'ring-2 ring-neutral-950'
                  : 'ring-1 ring-neutral-200 hover:ring-neutral-400',
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Image
                src={coverSrc}
                alt={label}
                fill
                className="object-contain p-1 transition-transform duration-300 group-hover:scale-[1.04]"
                sizes="44px"
              />
              <span className="sr-only">{label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
