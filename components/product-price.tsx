'use client'

import { useLocation } from '@/components/location-provider'
import { cn } from '@/lib/utils'

export function getEffectiveCompareAtPrice(
  price: number,
  compareAtPrice?: number | null,
): number | undefined {
  if (compareAtPrice == null || !Number.isFinite(compareAtPrice)) return undefined
  if (compareAtPrice <= price) return undefined
  return compareAtPrice
}

type ProductPriceProps = {
  price: number
  compareAtPrice?: number | null
  className?: string
  priceClassName?: string
  compareClassName?: string
  /** Larger PDP-style price */
  size?: 'sm' | 'md' | 'lg'
}

const priceSizeClass: Record<NonNullable<ProductPriceProps['size']>, string> = {
  sm: 'text-sm font-bold',
  md: 'text-2xl font-bold leading-none',
  lg: 'text-3xl font-bold sm:text-4xl',
}

const compareSizeClass: Record<NonNullable<ProductPriceProps['size']>, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-lg sm:text-xl',
}

/** Sale price + optional struck-through Shopify compare-at (“was”) price. */
export function ProductPrice({
  price,
  compareAtPrice,
  className,
  priceClassName,
  compareClassName,
  size = 'md',
}: ProductPriceProps) {
  const { formatPrice } = useLocation()
  const was = getEffectiveCompareAtPrice(price, compareAtPrice)

  return (
    <p
      className={cn(
        'flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[#E91E8C]',
        className,
      )}
    >
      <span className={cn(priceSizeClass[size], priceClassName)}>
        {formatPrice(price)}
      </span>
      {was !== undefined ? (
        <span
          className={cn(
            'font-medium text-neutral-400 line-through tabular-nums',
            compareSizeClass[size],
            compareClassName,
          )}
        >
          {formatPrice(was)}
        </span>
      ) : null}
    </p>
  )
}
