'use client'

import type { ReactNode } from 'react'
import { useCart } from '@/components/cart-provider'
import { cn } from '@/lib/utils'

type AddToCartButtonProps = {
  productId: string
  quantity?: number
  className?: string
  children?: ReactNode
}

export function AddToCartButton({
  productId,
  quantity = 1,
  className,
  children = 'Add to cart',
}: AddToCartButtonProps) {
  const { addItem } = useCart()

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        addItem(productId, quantity)
      }}
      className={cn(className)}
    >
      {children}
    </button>
  )
}
