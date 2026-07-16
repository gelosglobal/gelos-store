'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { useCart } from '@/components/cart-provider'
import { cn } from '@/lib/utils'

type AddToCartButtonProps = {
  productId: string
  quantity?: number
  className?: string
  children?: ReactNode
  variantImage?: string
  variantLabel?: string
  disabled?: boolean
  /** When set, renders a link instead of adding to cart (e.g. choose flavour on PDP). */
  href?: string
}

export function AddToCartButton({
  productId,
  quantity = 1,
  className,
  children = 'Add to cart',
  variantImage,
  variantLabel,
  disabled = false,
  href,
}: AddToCartButtonProps) {
  const { addItem } = useCart()

  if (href) {
    return (
      <Link
        href={href}
        onClick={(e) => e.stopPropagation()}
        className={cn(className)}
      >
        {children}
      </Link>
    )
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (disabled) return
        addItem(productId, quantity, {
          variantImage,
          variantLabel,
        })
      }}
      className={cn(
        className,
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      {children}
    </button>
  )
}
