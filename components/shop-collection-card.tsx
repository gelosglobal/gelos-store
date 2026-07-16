'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AddToCartButton } from '@/components/add-to-cart-button'
import { ProductVariantChoiceDialog } from '@/components/product-variant-choice-dialog'
import { ProductVariantThumbnails } from '@/components/product-variant-thumbnails'
import { useCart } from '@/components/cart-provider'
import { useLocation } from '@/components/location-provider'
import { useProducts } from '@/components/products-provider'
import {
  getAvailableStockForVariant,
  getDefaultVariantDisplayImage,
  getEffectiveVariantImages,
  productNeedsVariantChoice,
} from '@/lib/product-variant-images'
import { isExternalImageUrl, normalizeImageUrl } from '@/lib/image-url'
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
    stock?: number
    image: string
    variantImages?: string[]
    variantImageOptions?: { url: string; label: string; stock?: number }[]
  }
  badge?: 'NEW' | 'Best seller'
  /** Override card title (e.g. expanded flavour name). */
  displayName?: string
  /** Override hero image for a locked flavour card. */
  displayImage?: string
  /** Pre-selected flavour — skips thumbnails + flavour modal. */
  lockedVariantImage?: string
  lockedVariantLabel?: string
  href?: string
}

export function ShopCollectionCard({
  product,
  badge,
  displayName: displayNameOverride,
  displayImage: displayImageOverride,
  lockedVariantImage,
  lockedVariantLabel,
  href,
}: ShopCollectionCardProps) {
  const { addItem } = useCart()
  const { formatPrice } = useLocation()
  const { getProductById } = useProducts()
  const flavourLocked = Boolean(lockedVariantImage)
  const productHref = href ?? getProductHref(product)
  const variantImages = flavourLocked ? [] : getEffectiveVariantImages(product)
  const needsVariantChoice =
    !flavourLocked && productNeedsVariantChoice(product)
  const [variantDialogOpen, setVariantDialogOpen] = useState(false)
  const [activeImage, setActiveImage] = useState(() =>
    lockedVariantImage ?? getDefaultVariantDisplayImage(product),
  )

  useEffect(() => {
    setActiveImage(lockedVariantImage ?? getDefaultVariantDisplayImage(product))
  }, [
    lockedVariantImage,
    product.image,
    product.variantImageOptions,
    product.variantImages,
  ])

  const displayImage =
    displayImageOverride ||
    activeImage ||
    normalizeImageUrl(product.image)
  const displayName =
    displayNameOverride ||
    (flavourLocked && lockedVariantLabel
      ? lockedVariantLabel
      : getVariantDisplayName(product, displayImage))
  const variantSelection = flavourLocked
    ? {
        variantImage: lockedVariantImage,
        variantLabel: lockedVariantLabel,
      }
    : getVariantSelectionForCart(product, displayImage)
  const selectedOutOfStock =
    getAvailableStockForVariant(
      { stock: product.stock ?? 0, variantImageOptions: product.variantImageOptions },
      variantSelection.variantImage ?? displayImage,
    ) <= 0
  const fullProduct = getProductById(product.id)

  return (
    <article className="flex flex-col">
      <div className="relative aspect-[4/5] overflow-hidden bg-white">
        <Link
          href={productHref}
          className="absolute inset-0 block"
          aria-label={displayName}
        >
          <Image
            key={displayImage}
            src={displayImage}
            alt={displayName}
            fill
            className={getProductImageDisplayClass(
              product.id,
              displayImage,
              'transition-transform duration-300 hover:scale-[1.05]',
            )}
            sizes="(max-width: 640px) 50vw, 25vw"
            unoptimized={isExternalImageUrl(displayImage)}
          />
        </Link>

        {!flavourLocked ? (
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
        ) : null}

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

        {needsVariantChoice && fullProduct ? (
          <>
            <button
              type="button"
              onClick={() => setVariantDialogOpen(true)}
              className="mt-4 w-full rounded-full bg-neutral-950 py-3 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
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
            className="mt-4 w-full rounded-full bg-neutral-950 py-3 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
          >
            {selectedOutOfStock ? 'Out of stock' : 'Add to cart'}
          </AddToCartButton>
        )}
      </div>
    </article>
  )
}
