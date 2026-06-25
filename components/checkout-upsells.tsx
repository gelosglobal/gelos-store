'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo } from 'react'
import { AddToCartButton } from '@/components/add-to-cart-button'
import type { CartLineItem } from '@/components/cart-provider'
import { useLocation } from '@/components/location-provider'
import { useProducts } from '@/components/products-provider'
import { getCheckoutCrossSells } from '@/lib/checkout-recommendations'
import { getProductImageDisplayClass } from '@/lib/product-image-display'
import { getProductHref } from '@/lib/product-utils'

type CheckoutUpsellsProps = {
  cartItems: CartLineItem[]
}

function CrossSellCard({
  product,
}: {
  product: ReturnType<typeof useProducts>['products'][number]
}) {
  const { formatPrice } = useLocation()

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white">
      <Link
        href={getProductHref(product)}
        className="relative aspect-square bg-neutral-50"
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          className={getProductImageDisplayClass(product.id, product.image)}
          sizes="160px"
        />
      </Link>
      <div className="flex flex-1 flex-col p-3">
        <Link
          href={getProductHref(product)}
          className="line-clamp-2 text-xs font-semibold leading-snug text-neutral-950 hover:underline"
        >
          {product.name}
        </Link>
        <p className="mt-1 text-sm font-bold text-[#E91E8C]">
          {formatPrice(product.price)}
        </p>
        <AddToCartButton
          productId={product.id}
          className="mt-3 w-full rounded-full border border-neutral-200 py-2 text-xs font-semibold text-neutral-950 transition-colors hover:bg-neutral-50"
        >
          Add to order
        </AddToCartButton>
      </div>
    </article>
  )
}

export function CheckoutUpsells({ cartItems }: CheckoutUpsellsProps) {
  const { products } = useProducts()

  const crossSells = useMemo(
    () => getCheckoutCrossSells(cartItems, products, 4),
    [cartItems, products],
  )

  if (crossSells.length === 0) {
    return null
  }

  return (
    <section aria-labelledby="checkout-cross-sells">
      <h2
        id="checkout-cross-sells"
        className="text-base font-bold text-neutral-950 sm:text-lg"
      >
        Complete your order
      </h2>
      <p className="mt-1 mb-4 text-sm text-neutral-600">
        Customers often add these with their picks.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {crossSells.map((product) => (
          <CrossSellCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
