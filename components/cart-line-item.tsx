'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { useLocation } from '@/components/location-provider'
import { getProductImageDisplayClass } from '@/lib/product-image-display'
import { getProductHref } from '@/lib/product-utils'
import { cn } from '@/lib/utils'

export type CartLineItemData = {
  lineKey: string
  id: string
  productName?: string
  name: string
  variantLabel?: string
  price: number
  image: string
  quantity: number
}

type CartLineItemProps = {
  item: CartLineItemData
  variant?: 'default' | 'compact'
  onQuantityChange: (lineKey: string, quantity: number) => void
  onRemove: (lineKey: string) => void
}


function QuantityStepper({
  quantity,
  onDecrease,
  onIncrease,
  compact = false,
}: {
  quantity: number
  onDecrease: () => void
  onIncrease: () => void
  compact?: boolean
}) {
  return (
    <div className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50">
      <button
        type="button"
        onClick={onDecrease}
        disabled={quantity <= 1}
        className={cn(
          'rounded-l-full text-neutral-600 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40',
          compact ? 'p-2' : 'p-2.5',
        )}
        aria-label="Decrease quantity"
      >
        <Minus className={compact ? 'size-3.5' : 'size-4'} />
      </button>
      <span
        className={cn(
          'min-w-[2.25rem] px-2 text-center font-semibold tabular-nums',
          compact ? 'text-sm' : 'text-sm',
        )}
      >
        {quantity}
      </span>
      <button
        type="button"
        onClick={onIncrease}
        className={cn(
          'rounded-r-full text-neutral-600 transition-colors hover:bg-neutral-100',
          compact ? 'p-2' : 'p-2.5',
        )}
        aria-label="Increase quantity"
      >
        <Plus className={compact ? 'size-3.5' : 'size-4'} />
      </button>
    </div>
  )
}

export function CartLineItem({
  item,
  variant = 'default',
  onQuantityChange,
  onRemove,
}: CartLineItemProps) {
  const { formatPrice } = useLocation()
  const lineTotal = item.price * item.quantity

  if (variant === 'compact') {
    return (
      <article className="px-5 py-4">
        <Link
          href={getProductHref(item)}
          className="line-clamp-2 text-sm font-medium leading-snug text-neutral-950 hover:underline"
        >
          {item.name}
        </Link>

        <div className="mt-3 flex items-start gap-3">
          <Link
            href={getProductHref(item)}
            className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-neutral-50"
          >
            <Image
              src={item.image}
              alt={item.name}
              fill
              className="object-cover object-center"
              sizes="64px"
            />
          </Link>

          <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#E91E8C]">
                {formatPrice(lineTotal)}
              </p>
              <div className="mt-2">
                <QuantityStepper
                  compact
                  quantity={item.quantity}
                  onDecrease={() =>
                    onQuantityChange(item.lineKey, item.quantity - 1)
                  }
                  onIncrease={() =>
                    onQuantityChange(item.lineKey, item.quantity + 1)
                  }
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => onRemove(item.lineKey)}
              className="shrink-0 rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-950"
              aria-label={`Remove ${item.name}`}
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>
      </article>
    )
  }

  return (
    <article className="flex gap-4 rounded-2xl border border-neutral-200 bg-white p-4 sm:gap-5 sm:p-5">
      <Link
        href={getProductHref(item)}
        className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-white sm:h-28 sm:w-28"
      >
        <Image
          src={item.image}
          alt={item.name}
          fill
          className={getProductImageDisplayClass(item.id, item.image)}
          sizes="112px"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={getProductHref(item)}
              className="line-clamp-2 text-sm font-semibold text-neutral-950 hover:underline sm:text-base"
            >
              {item.name}
            </Link>
            {item.variantLabel &&
            item.productName &&
            item.variantLabel !== item.productName ? (
              <p className="mt-0.5 text-xs text-neutral-500">{item.productName}</p>
            ) : null}
            <p className="mt-1 text-sm font-bold text-[#E91E8C]">
              {formatPrice(item.price)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onRemove(item.lineKey)}
            className="shrink-0 rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-950"
            aria-label={`Remove ${item.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <QuantityStepper
            quantity={item.quantity}
            onDecrease={() =>
              onQuantityChange(item.lineKey, item.quantity - 1)
            }
            onIncrease={() =>
              onQuantityChange(item.lineKey, item.quantity + 1)
            }
          />
          <p className="text-base font-bold text-neutral-950 tabular-nums">
            {formatPrice(lineTotal)}
          </p>
        </div>
      </div>
    </article>
  )
}
