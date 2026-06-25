'use client'

import { Plus } from 'lucide-react'
import { useState } from 'react'
import type { CartLineItemData } from '@/components/cart-line-item'
import { CartLineItem } from '@/components/cart-line-item'
import { cn } from '@/lib/utils'

type CartItemsCardProps = {
  items: CartLineItemData[]
  onQuantityChange: (lineKey: string, quantity: number) => void
  onRemove: (lineKey: string) => void
}

export function CartItemsCard({
  items,
  onQuantityChange,
  onRemove,
}: CartItemsCardProps) {
  const [expanded, setExpanded] = useState(true)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
      <div
        className={cn(
          'divide-y divide-neutral-100',
          !expanded && 'hidden',
        )}
      >
        {items.map((item) => (
          <CartLineItem
            key={item.lineKey}
            item={item}
            variant="compact"
            onQuantityChange={onQuantityChange}
            onRemove={onRemove}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between px-5 py-3.5 text-sm text-neutral-600 transition-colors hover:bg-neutral-50"
      >
        <span>
          Show {itemCount} item{itemCount === 1 ? '' : 's'}
        </span>
        <span
          className={cn(
            'flex size-6 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition-transform',
            expanded && 'rotate-45',
          )}
          aria-hidden
        >
          <Plus className="size-3.5" />
        </span>
      </button>
    </div>
  )
}
