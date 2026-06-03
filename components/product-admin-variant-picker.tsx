'use client'

import Image from 'next/image'
import { isExternalImageUrl } from '@/lib/image-url'
import { cn } from '@/lib/utils'

type ProductAdminVariantPickerProps = {
  images: string[]
  activeImage: string
  onSelect: (src: string) => void
  label?: string
}

export function ProductAdminVariantPicker({
  images,
  activeImage,
  onSelect,
  label = 'Choose your flavour',
}: ProductAdminVariantPickerProps) {
  if (images.length <= 1) return null

  return (
    <div className="pt-3">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500 sm:text-xs">
        {label}
      </p>
      <div className="flex flex-wrap gap-2.5">
        {images.map((src, index) => {
          const isActive = src === activeImage
          return (
            <button
              key={`${src}-${index}`}
              type="button"
              onClick={() => onSelect(src)}
              className={cn(
                'relative h-11 w-11 overflow-hidden rounded-lg bg-white ring-2 transition-all sm:h-12 sm:w-12',
                isActive
                  ? 'ring-neutral-950'
                  : 'ring-neutral-200 hover:ring-neutral-400',
              )}
              aria-label={`View variant ${index + 1}`}
              aria-pressed={isActive}
            >
              <Image
                src={src}
                alt=""
                fill
                className="object-contain p-1"
                sizes="48px"
                unoptimized={isExternalImageUrl(src)}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
