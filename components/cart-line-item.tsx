'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { useLocation } from '@/components/location-provider'
import { getProductHref } from '@/lib/product-utils'

export type CartLineItemData = {
  id: string
  name: string
  price: number
  image: string
  quantity: number
}

type CartLineItemProps = {
  item: CartLineItemData
  onQuantityChange: (id: string, quantity: number) => void
  onRemove: (id: string) => void
}

export function CartLineItem({
  item,
  onQuantityChange,
  onRemove,
}: CartLineItemProps) {
  const { formatPrice } = useLocation()
  const lineTotal = item.price * item.quantity

  return (
    <article className="flex gap-4 rounded-2xl border border-neutral-200 bg-white p-4 sm:gap-5 sm:p-5">
      <Link
        href={getProductHref(item)}
        className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-neutral-100 sm:h-28 sm:w-28"
      >
        <Image
          src={item.image}
          alt={item.name}
          fill
          className="object-cover object-center"
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
            <p className="mt-1 text-sm font-bold text-[#E91E8C]">
              {formatPrice(item.price)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="shrink-0 rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-950"
            aria-label={`Remove ${item.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50">
            <button
              type="button"
              onClick={() => onQuantityChange(item.id, item.quantity - 1)}
              disabled={item.quantity <= 1}
              className="rounded-l-full p-2.5 text-neutral-600 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-[2.5rem] px-2 text-center text-sm font-semibold tabular-nums">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => onQuantityChange(item.id, item.quantity + 1)}
              className="rounded-r-full p-2.5 text-neutral-600 transition-colors hover:bg-neutral-100"
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <p className="text-base font-bold text-neutral-950 tabular-nums">
            {formatPrice(lineTotal)}
          </p>
        </div>
      </div>
    </article>
  )
}
