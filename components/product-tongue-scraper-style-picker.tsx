'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  getTongueScraperStyleCover,
  getTongueScraperStyleLabel,
  tongueScraperStyleOrder,
} from '@/lib/tongue-scraper-style-covers'
import { getProductHref, getProductSlug } from '@/lib/product-utils'
import type { Product } from '@/lib/types/product'
import { cn } from '@/lib/utils'

type ProductTongueScraperStylePickerProps = {
  products: Product[]
  currentProduct: Product
}

export function ProductTongueScraperStylePicker({
  products,
  currentProduct,
}: ProductTongueScraperStylePickerProps) {
  const currentSlug = getProductSlug(currentProduct)
  const orderIndex = new Map(
    tongueScraperStyleOrder.map((id, index) => [id, index]),
  )
  const sorted = [...products].sort(
    (a, b) => (orderIndex.get(a.id) ?? 99) - (orderIndex.get(b.id) ?? 99),
  )

  if (sorted.length === 0) return null

  return (
    <div className="pt-3">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500 sm:text-xs">
        Choose your style
      </p>
      <div className="flex flex-wrap gap-2">
        {sorted.map((variant) => {
          const slug = getProductSlug(variant)
          const isActive = slug === currentSlug
          const coverSrc = getTongueScraperStyleCover(variant.id, variant.image)
          const styleLabel = getTongueScraperStyleLabel(variant.name)

          return (
            <Link
              key={variant.id}
              href={getProductHref(variant)}
              title={variant.name}
              className={cn(
                'group relative flex h-14 w-[4.5rem] shrink-0 flex-col overflow-hidden rounded-lg bg-neutral-100 transition-all sm:h-16 sm:w-20',
                isActive
                  ? 'ring-2 ring-neutral-950'
                  : 'ring-1 ring-neutral-200 hover:ring-neutral-400',
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative min-h-0 flex-1">
                <Image
                  src={coverSrc}
                  alt={styleLabel}
                  fill
                  className="object-contain p-1.5 transition-transform duration-300 group-hover:scale-[1.04]"
                  sizes="80px"
                />
              </div>
              <span
                className={cn(
                  'border-t border-neutral-200/80 px-1 py-1 text-center text-[9px] font-semibold leading-tight sm:text-[10px]',
                  isActive ? 'bg-neutral-950 text-white' : 'bg-white text-neutral-700',
                )}
              >
                {styleLabel}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
