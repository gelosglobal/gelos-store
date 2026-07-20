'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AddToCartButton } from '@/components/add-to-cart-button'
import { ProductVariantChoiceDialog } from '@/components/product-variant-choice-dialog'
import { useCart } from '@/components/cart-provider'
import { useLocation } from '@/components/location-provider'
import { useProducts } from '@/components/products-provider'
import { ProductVariantThumbnails } from '@/components/product-variant-thumbnails'
import { bestSellerMeta } from '@/lib/best-seller-meta'
import { getProductImageDisplayClass } from '@/lib/product-image-display'
import {
  getAvailableStockForVariant,
  getDefaultVariantDisplayImage,
  getEffectiveVariantImages,
  productNeedsVariantChoice,
} from '@/lib/product-variant-images'
import { getProductDisplayBadge } from '@/lib/product-tags'
import type { ProductTagId } from '@/lib/product-tags'
import { isExternalImageUrl, normalizeImageUrl } from '@/lib/image-url'
import { getProductHref } from '@/lib/product-utils'
import { getVariantSelectionForCart } from '@/lib/variant-display'

type BestSellerCardProduct = {
  id: string
  name: string
  category: string
  price: number
  stock?: number
  image: string
  tags?: ProductTagId[]
  variantImages?: string[]
  variantImageOptions?: { url: string; label: string; stock?: number }[]
}

type BestSellerCardProps = {
  product: BestSellerCardProduct
}

export function BestSellerCard({ product }: BestSellerCardProps) {
  const { addItem } = useCart()
  const { formatPrice } = useLocation()
  const { getProductById } = useProducts()
  const meta = bestSellerMeta[product.id]
  const variantImages = getEffectiveVariantImages(product)
  const needsVariantChoice = productNeedsVariantChoice(product)
  const [variantDialogOpen, setVariantDialogOpen] = useState(false)
  const [activeImage, setActiveImage] = useState(() =>
    getDefaultVariantDisplayImage(product),
  )

  useEffect(() => {
    setActiveImage(getDefaultVariantDisplayImage(product))
  }, [product.image, product.variantImageOptions, product.variantImages])

  const badge =
    getProductDisplayBadge({ ...product, tags: product.tags ?? [] }) ??
    meta?.badge

  const displayImage = activeImage || normalizeImageUrl(product.image)
  // Keep catalogue name on storefront cards; PDP handles flavour title swaps.
  const displayName = product.name
  const variantSelection = getVariantSelectionForCart(product, displayImage)
  const selectedOutOfStock =
    getAvailableStockForVariant(
      { stock: product.stock ?? 0, variantImageOptions: product.variantImageOptions },
      displayImage,
    ) <= 0
  const fullProduct = getProductById(product.id)

  return (
    <article className="flex w-[min(72vw,280px)] shrink-0 snap-start flex-col sm:w-[280px]">
      <div className="relative aspect-[5/6] w-full overflow-hidden rounded-2xl bg-white">
        <Link
          href={getProductHref(product)}
          className="absolute inset-0 block"
          aria-label={displayName}
        >
          <Image
            key={displayImage}
            src={displayImage}
            alt={displayName}
            fill
            className={getProductImageDisplayClass(product.id, displayImage)}
            sizes="280px"
            unoptimized={isExternalImageUrl(displayImage)}
          />
        </Link>

        <ProductVariantThumbnails
          productId={product.id}
          variantImages={variantImages}
          activeImage={activeImage}
          onSelect={setActiveImage}
          isImageDisabled={(src) =>
            getAvailableStockForVariant(
              {
                stock: product.stock ?? 0,
                variantImageOptions: product.variantImageOptions,
              },
              src,
            ) <= 0
          }
        />

        {badge && (
          <span className="absolute top-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-neutral-900 shadow-sm">
            {badge}
          </span>
        )}
      </div>

      <Link href={getProductHref(product)} className="mt-4 text-center">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
          {displayName}
        </h3>
      </Link>

      <p className="mt-2 text-center text-2xl font-bold leading-none text-[#E91E8C]">
        {formatPrice(product.price)}
      </p>

      {needsVariantChoice && fullProduct ? (
        <>
          <button
            type="button"
            onClick={() => setVariantDialogOpen(true)}
            className="mt-3 w-full rounded-full bg-neutral-950 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
          >
            Add to cart
          </button>
          <ProductVariantChoiceDialog
            open={variantDialogOpen}
            onOpenChange={setVariantDialogOpen}
            product={fullProduct}
            onConfirm={({ variantImage, variantLabel }) => {
              addItem(product.id, 1, { variantImage, variantLabel })
              if (variantImage) setActiveImage(variantImage)
            }}
          />
        </>
      ) : (
        <AddToCartButton
          productId={product.id}
          variantImage={variantSelection.variantImage}
          variantLabel={variantSelection.variantLabel}
          disabled={selectedOutOfStock}
          className="mt-3 w-full rounded-full bg-neutral-950 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
        >
          {selectedOutOfStock ? 'Out of stock' : 'Add to cart'}
        </AddToCartButton>
      )}
    </article>
  )
}
