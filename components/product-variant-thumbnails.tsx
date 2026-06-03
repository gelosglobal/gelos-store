'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

const MAX_VISIBLE = 3

type ProductVariantThumbnailsProps = {
  variantImages: string[]
  activeImage: string
  onSelect: (src: string) => void
  productId: string
  className?: string
}

function inferThumbFit(src: string): 'contain' | 'cover' {
  const lower = src.toLowerCase()
  if (
    lower.endsWith('.png') ||
    lower.includes('watermelon') ||
    lower.includes('grape-mint') ||
    lower.includes('energy-drink') ||
    lower.includes('foaming-mouthwash') ||
    lower.includes('led-whitening')
  ) {
    return 'contain'
  }
  return 'cover'
}

export function ProductVariantThumbnails({
  variantImages,
  activeImage,
  onSelect,
  productId,
  className,
}: ProductVariantThumbnailsProps) {
  const visibleVariants = variantImages.slice(0, MAX_VISIBLE)
  const extraVariantCount = Math.max(0, variantImages.length - MAX_VISIBLE)

  if (visibleVariants.length === 0) return null

  return (
    <div
      className={cn(
        'absolute left-2 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-1.5 sm:left-3',
        className,
      )}
    >
      {visibleVariants.map((src, index) => (
        <button
          key={`${productId}-variant-${index}`}
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onSelect(src)
          }}
          className={cn(
            'relative h-9 w-9 shrink-0 overflow-hidden rounded-md border-2 bg-white shadow-sm transition-colors sm:h-10 sm:w-10',
            activeImage === src
              ? 'border-neutral-900'
              : 'border-neutral-200 hover:border-neutral-400',
          )}
        >
          <Image
            src={src}
            alt=""
            fill
            className={cn(
              inferThumbFit(src) === 'contain'
                ? 'object-contain p-0.5'
                : 'object-cover',
            )}
            sizes="40px"
          />
        </button>
      ))}
      {extraVariantCount > 0 && (
        <div className="flex h-9 w-9 items-center justify-center rounded-md border border-neutral-200 bg-white text-[10px] font-semibold text-neutral-600 shadow-sm sm:h-10 sm:w-10">
          +{extraVariantCount}
        </div>
      )}
    </div>
  )
}
