'use client'

import Image from 'next/image'
import { isExternalImageUrl } from '@/lib/image-url'
import type { ProductVariantOption } from '@/lib/types/product-variant'
import { cn } from '@/lib/utils'

type ProductAdminVariantPickerProps = {
  options: ProductVariantOption[]
  activeImage: string | null
  onSelect: (src: string) => void
  label?: string
  isOptionDisabled?: (option: ProductVariantOption) => boolean
  /** denser grid used in flavour choice dialogs */
  layout?: 'wrap' | 'grid'
}

export function ProductAdminVariantPicker({
  options,
  activeImage,
  onSelect,
  label = 'Choose your flavour',
  isOptionDisabled,
  layout = 'wrap',
}: ProductAdminVariantPickerProps) {
  if (options.length <= 1) return null

  return (
    <div className={layout === 'grid' ? '' : 'pt-3'}>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500 sm:text-xs">
        {label}
      </p>
      <div
        className={cn(
          layout === 'grid'
            ? 'grid grid-cols-3 gap-3 sm:grid-cols-4'
            : 'flex flex-wrap gap-3',
        )}
      >
        {options.map((option, index) => {
          const isActive = option.url === activeImage
          const tileLabel = option.label.trim()
          const disabled = isOptionDisabled?.(option) ?? false

          return (
            <button
              key={`${option.url}-${index}`}
              type="button"
              onClick={() => onSelect(option.url)}
              disabled={disabled}
              className={cn(
                'flex flex-col items-center gap-1.5',
                layout === 'wrap' && 'w-[4.5rem] sm:w-20',
                disabled && 'cursor-not-allowed opacity-40',
              )}
              aria-label={
                tileLabel ? `${tileLabel} variant` : `Variant option ${index + 1}`
              }
              aria-pressed={isActive}
            >
              <span
                className={cn(
                  'relative overflow-hidden rounded-lg bg-white ring-2 transition-all',
                  layout === 'grid'
                    ? 'aspect-square w-full'
                    : 'h-11 w-11 sm:h-12 sm:w-12',
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
                  sizes={layout === 'grid' ? '120px' : '48px'}
                  unoptimized={isExternalImageUrl(option.url)}
                />
              </span>
              {tileLabel ? (
                <span
                  className={cn(
                    'max-w-full text-center text-[10px] font-medium leading-tight sm:text-xs',
                    isActive ? 'text-neutral-950' : 'text-neutral-500',
                    disabled && 'text-neutral-400',
                  )}
                >
                  {disabled ? `${tileLabel} · Sold out` : tileLabel}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
