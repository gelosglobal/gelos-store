'use client'

import type { ReactNode } from 'react'
import { useCart } from '@/components/cart-provider'
import { cn } from '@/lib/utils'

type AddToCartButtonProps = {
  productId: string
  quantity?: number
  className?: string
  children?: ReactNode
  variantImage?: string
  variantLabel?: string
}

export function AddToCartButton({
  productId,
  quantity = 1,
  className,
  children = 'Add to cart',
  variantImage,
  variantLabel,
}: AddToCartButtonProps) {
  const { addItem } = useCart()

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        addItem(productId, quantity, {
          variantImage,
          variantLabel,
        })
      }}
      className={cn(className)}
    >
      {children}
    </button>
  )
}
