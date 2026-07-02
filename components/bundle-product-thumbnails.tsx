'use client'

import Image from 'next/image'
import { getDefaultVariantDisplayImage } from '@/lib/product-variant-images'
import { isExternalImageUrl } from '@/lib/image-url'
import { cn } from '@/lib/utils'
import type { Product } from '@/lib/types/product'

const MAX_VISIBLE = 4

type BundleProductThumbnailsProps = {
  products: Product[]
  bundleImage?: string
  activeImage: string
  onSelect: (src: string) => void
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

export function BundleProductThumbnails({
  products,
  bundleImage,
  activeImage,
  onSelect,
  className,
}: BundleProductThumbnailsProps) {
  const thumbItems: { key: string; src: string }[] = []
  const seen = new Set<string>()

  const pushThumb = (key: string, src: string) => {
    if (!src || seen.has(src)) return
    seen.add(src)
    thumbItems.push({ key, src })
  }

  if (bundleImage?.trim()) {
    pushThumb('bundle-cover', bundleImage.trim())
  }

  for (const product of products) {
    pushThumb(product.id, getDefaultVariantDisplayImage(product))
  }

  const visibleItems = thumbItems.slice(0, MAX_VISIBLE)
  const extraCount = Math.max(0, thumbItems.length - MAX_VISIBLE)

  if (visibleItems.length <= 1) return null

  const thumbSize = 'h-8 w-8 sm:h-9 sm:w-9'

  return (
    <div
      className={cn(
        'absolute left-2 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-1.5 sm:left-3',
        className,
      )}
    >
      {visibleItems.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onSelect(item.src)
          }}
          className={cn(
            'relative shrink-0 overflow-hidden rounded-md border-2 bg-white shadow-sm transition-colors',
            thumbSize,
            activeImage === item.src
              ? 'border-neutral-900'
              : 'border-neutral-200 hover:border-neutral-400',
          )}
        >
          <Image
            src={item.src}
            alt=""
            fill
            className={cn(
              inferThumbFit(item.src) === 'contain'
                ? 'object-contain p-0.5'
                : 'object-cover',
            )}
            sizes="40px"
            unoptimized={isExternalImageUrl(item.src)}
          />
        </button>
      ))}
      {extraCount > 0 ? (
        <div
          className={cn(
            'flex items-center justify-center rounded-md border border-neutral-200 bg-white text-[10px] font-semibold text-neutral-600 shadow-sm',
            thumbSize,
          )}
        >
          +{extraCount}
        </div>
      ) : null}
    </div>
  )
}
