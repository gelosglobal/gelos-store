'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AddToCartButton } from '@/components/add-to-cart-button'
import { ProductVariantThumbnails } from '@/components/product-variant-thumbnails'
import {
  bestSellerMeta,
} from '@/lib/best-seller-meta'
import { getProductImageDisplayClass } from '@/lib/product-image-display'
import { getEffectiveVariantImages } from '@/lib/product-variant-images'
import { getProductDisplayBadge } from '@/lib/product-tags'
import type { ProductTagId } from '@/lib/product-tags'
import { isExternalImageUrl } from '@/lib/image-url'
import { getProductHref } from '@/lib/product-utils'
import {
  getVariantDisplayName,
  getVariantSelectionForCart,
} from '@/lib/variant-display'

type BestSellerCardProduct = {
  id: string
  name: string
  category: string
  price: number
  image: string
  tags?: ProductTagId[]
  variantImages?: string[]
  variantImageOptions?: { url: string; label: string }[]
}

type BestSellerCardProps = {
  product: BestSellerCardProduct
}

export function BestSellerCard({ product }: BestSellerCardProps) {
  const meta = bestSellerMeta[product.id]
  const variantImages = getEffectiveVariantImages(product)
  const [activeImage, setActiveImage] = useState(product.image)

  useEffect(() => {
    setActiveImage(product.image)
  }, [product.image])

  const badge =
    getProductDisplayBadge({ ...product, tags: product.tags ?? [] }) ??
    meta?.badge

  const displayPrice = Number.isInteger(product.price)
    ? product.price.toString()
    : product.price.toFixed(2).replace(/\.00$/, '')

  const variantSelection = getVariantSelectionForCart(product, activeImage)
  const displayName = getVariantDisplayName(product, activeImage)

  return (
    <article className="flex w-[min(72vw,280px)] shrink-0 snap-start flex-col sm:w-[280px]">
      <div className="relative aspect-[5/6] w-full overflow-hidden rounded-2xl bg-white">
        <Link
          href={getProductHref(product)}
          className="absolute inset-0 block"
          aria-label={displayName}
        >
          <Image
            key={activeImage}
            src={activeImage}
            alt={displayName}
            fill
            className={getProductImageDisplayClass(product.id, activeImage)}
            sizes="280px"
            unoptimized={isExternalImageUrl(activeImage)}
          />
        </Link>

        <ProductVariantThumbnails
          productId={product.id}
          variantImages={variantImages}
          activeImage={activeImage}
          onSelect={setActiveImage}
        />

        {badge && (
          <span className="absolute top-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-neutral-900 shadow-sm">
            {badge}
          </span>
        )}
      </div>

      <Link href={getProductHref(product)} className="mt-4 text-center">
        <h3 className="text-sm font-medium leading-snug text-foreground line-clamp-2">
          {displayName}
        </h3>
      </Link>

      <p className="mt-2 flex items-baseline justify-center gap-0.5">
        <span className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
          GH
        </span>
        <span className="text-2xl font-bold leading-none text-[#E91E8C]">₵{displayPrice}</span>
      </p>

      <AddToCartButton
        productId={product.id}
        variantImage={variantSelection.variantImage}
        variantLabel={variantSelection.variantLabel}
        className="mt-3 w-full rounded-full bg-neutral-950 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
      />
    </article>
  )
}
