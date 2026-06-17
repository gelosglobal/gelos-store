'use client'

import Image from 'next/image'
import Link from 'next/link'
import { AddToCartButton } from '@/components/add-to-cart-button'
import { formatPrice } from '@/lib/format-price'
import { getProductImageDisplayClass } from '@/lib/product-image-display'
import { getProductHref } from '@/lib/product-utils'

type ProductCardProduct = {
  id: string
  name: string
  price: number
  image: string
}

type ProductCardProps = {
  product: ProductCardProduct
}

export function ProductCard({ product }: ProductCardProps) {
  const productHref = getProductHref(product)

  return (
    <article className="flex flex-col bg-background">
      <Link
        href={productHref}
        className="relative block aspect-square overflow-hidden rounded-t-2xl bg-white"
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          className={getProductImageDisplayClass(
            product.id,
            product.image,
            'transition-transform duration-300 hover:scale-105',
          )}
          sizes="(max-width: 640px) 100vw, 50vw"
        />
      </Link>

      <div className="px-4 pt-4 pb-3">
        <Link href={productHref}>
          <h3 className="text-left text-base font-medium leading-snug text-foreground hover:underline">
            {product.name}
          </h3>
        </Link>
        <p className="mt-1 text-left text-base font-medium text-foreground">
          {formatPrice(product.price)}
        </p>
      </div>

      <div className="mt-auto flex flex-col">
        <AddToCartButton
          productId={product.id}
          className="flex w-full items-center justify-center gap-2 bg-neutral-200 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-neutral-300"
        >
          Add to cart
        </AddToCartButton>
        <Link
          href={productHref}
          className="flex w-full items-center justify-center bg-neutral-950 py-3.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
        >
          Buy it now
        </Link>
      </div>
    </article>
  )
}
