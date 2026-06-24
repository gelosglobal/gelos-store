'use client'

import Image from 'next/image'
import { isExternalImageUrl } from '@/lib/image-url'
import type { ProductVariantOption } from '@/lib/types/product-variant'
import { cn } from '@/lib/utils'

type ProductAdminVariantPickerProps = {
  options: ProductVariantOption[]
  activeImage: string
  onSelect: (src: string) => void
  label?: string
}

export function ProductAdminVariantPicker({
  options,
  activeImage,
  onSelect,
  label = 'Choose your flavour',
}: ProductAdminVariantPickerProps) {
  if (options.length <= 1) return null

  return (
    <div className="pt-3">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500 sm:text-xs">
        {label}
      </p>
      <div className="flex flex-wrap gap-3">
        {options.map((option, index) => {
          const isActive = option.url === activeImage
          const tileLabel = option.label.trim()

          return (
            <button
              key={`${option.url}-${index}`}
              type="button"
              onClick={() => onSelect(option.url)}
              className="flex w-[4.5rem] flex-col items-center gap-1.5 sm:w-20"
              aria-label={
                tileLabel ? `${tileLabel} variant` : `Variant option ${index + 1}`
              }
              aria-pressed={isActive}
            >
              <span
                className={cn(
                  'relative h-11 w-11 overflow-hidden rounded-lg bg-white ring-2 transition-all sm:h-12 sm:w-12',
                  isActive
                    ? 'ring-neutral-950'
                    : 'ring-neutral-200 hover:ring-neutral-400',
                )}
              >
                <Image
                  src={option.url}
                  alt=""
                  fill
                  className="object-contain p-1"
                  sizes="48px"
                  unoptimized={isExternalImageUrl(option.url)}
                />
              </span>
              {tileLabel ? (
                <span
                  className={cn(
                    'max-w-full text-center text-[10px] font-medium leading-tight sm:text-xs',
                    isActive ? 'text-neutral-950' : 'text-neutral-500',
                  )}
                >
                  {tileLabel}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
