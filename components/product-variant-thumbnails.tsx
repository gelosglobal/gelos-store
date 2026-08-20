'use client'

import Image from 'next/image'
import { normalizeImageUrl } from '@/lib/image-url'
import { cn } from '@/lib/utils'

const MAX_VISIBLE = 3

type ProductVariantThumbnailsProps = {
  variantImages: string[]
  activeImage: string | null
  onSelect: (src: string) => void
  productId: string
  className?: string
  isImageDisabled?: (src: string) => boolean
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
  isImageDisabled,
}: ProductVariantThumbnailsProps) {
  const visibleVariants = variantImages.slice(0, MAX_VISIBLE)
  const extraVariantCount = Math.max(0, variantImages.length - MAX_VISIBLE)
  const activeNormalized = normalizeImageUrl(activeImage ?? '')

  if (visibleVariants.length === 0) return null

  return (
    <div
      className={cn(
        'absolute left-2 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-1.5 sm:left-3',
        className,
      )}
    >
      {visibleVariants.map((src, index) => {
        const disabled = isImageDisabled?.(src) ?? false
        const srcNormalized = normalizeImageUrl(src)
        const isActive = activeNormalized === srcNormalized

        return (
          <button
            key={`${productId}-variant-${index}`}
            type="button"
            disabled={disabled}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (disabled) return
              onSelect(srcNormalized)
            }}
            className={cn(
              'relative z-20 h-9 w-9 shrink-0 overflow-hidden rounded-md border-2 bg-white shadow-sm transition-colors sm:h-10 sm:w-10',
              isActive
                ? 'border-neutral-900'
                : 'border-neutral-200 hover:border-neutral-400',
              disabled && 'cursor-not-allowed opacity-40',
            )}
            aria-label={
              disabled ? 'Flavour out of stock' : `Select flavour ${index + 1}`
            }
          >
            <Image
              src={srcNormalized}
              alt=""
              fill
              className={cn(
                inferThumbFit(srcNormalized) === 'contain'
                  ? 'object-contain p-0.5'
                  : 'object-cover',
              )}
              sizes="40px"
              unoptimized={/^https?:\/\//i.test(srcNormalized)}
            />
          </button>
        )
      })}
      {extraVariantCount > 0 && (
        <div className="flex h-9 w-9 items-center justify-center rounded-md border border-neutral-200 bg-white text-[10px] font-semibold text-neutral-600 shadow-sm sm:h-10 sm:w-10">
          +{extraVariantCount}
        </div>
      )}
    </div>
  )
}
