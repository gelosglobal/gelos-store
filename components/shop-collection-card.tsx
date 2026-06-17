'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AddToCartButton } from '@/components/add-to-cart-button'
import { ProductVariantThumbnails } from '@/components/product-variant-thumbnails'
import { useLocation } from '@/components/location-provider'
import { getEffectiveVariantImages } from '@/lib/product-variant-images'
import { isExternalImageUrl } from '@/lib/image-url'
import { getProductImageDisplayClass } from '@/lib/product-image-display'
import { getProductHref } from '@/lib/product-utils'
import {
  getVariantDisplayName,
  getVariantSelectionForCart,
} from '@/lib/variant-display'

type ShopCollectionCardProps = {
  product: {
    id: string
    name: string
    category: string
    price: number
    image: string
    variantImages?: string[]
    variantImageOptions?: { url: string; label: string }[]
  }
  badge?: 'NEW' | 'Best seller'
}

export function ShopCollectionCard({
  product,
  badge,
}: ShopCollectionCardProps) {
  const { formatPrice } = useLocation()
  const productHref = getProductHref(product)
  const variantImages = getEffectiveVariantImages(product)
  const [activeImage, setActiveImage] = useState(product.image)

  useEffect(() => {
    setActiveImage(product.image)
  }, [product.image])

  const variantSelection = getVariantSelectionForCart(product, activeImage)
  const displayName = getVariantDisplayName(product, activeImage)

  return (
    <article className="flex flex-col">
      <div className="relative aspect-[4/5] overflow-hidden bg-white">
        <Link
          href={productHref}
          className="absolute inset-0 block"
          aria-label={displayName}
        >
          <Image
            key={activeImage}
            src={activeImage}
            alt={displayName}
            fill
            className={getProductImageDisplayClass(
              product.id,
              activeImage,
              'transition-transform duration-300 hover:scale-[1.05]',
            )}
            sizes="(max-width: 640px) 50vw, 25vw"
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
          <span className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-md bg-white px-2.5 py-1 text-[11px] font-semibold tracking-wide text-neutral-900 shadow-sm">
            {badge}
          </span>
        )}
      </div>

      <div className="flex flex-col items-center px-2 pt-4 text-center">
        <Link href={productHref}>
          <h3 className="text-sm font-medium leading-snug text-neutral-950 hover:underline">
            {displayName}
          </h3>
        </Link>
        <p className="mt-1.5 text-sm font-bold text-[#E91E8C]">
          {formatPrice(product.price)}
        </p>
        <AddToCartButton
          productId={product.id}
          variantImage={variantSelection.variantImage}
          variantLabel={variantSelection.variantLabel}
          className="mt-4 w-full rounded-full bg-neutral-950 py-3 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
        />
      </div>
    </article>
  )
}
