'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AddToCartButton } from '@/components/add-to-cart-button'
import { ProductPrice } from '@/components/product-price'
import { ProductVariantChoiceDialog } from '@/components/product-variant-choice-dialog'
import { ProductVariantThumbnails } from '@/components/product-variant-thumbnails'
import { useCart } from '@/components/cart-provider'
import { useProducts } from '@/components/products-provider'
import {
  getAvailableStockForVariant,
  getDefaultVariantDisplayImage,
  getEffectiveVariantImages,
  hasAdminVariantPicker,
  productNeedsVariantChoice,
} from '@/lib/product-variant-images'
import { isExternalImageUrl, normalizeImageUrl } from '@/lib/image-url'
import { getProductImageDisplayClass } from '@/lib/product-image-display'
import { getProductHref } from '@/lib/product-utils'
import { resolveCartProductId } from '@/lib/product-line-parents'
import { getVariantSelectionForCart } from '@/lib/variant-display'
import type { Product } from '@/lib/types/product'
import type { ProductVariantOption } from '@/lib/types/product-variant'

type ShopCollectionCardProps = {
  product: {
    id: string
    name: string
    category: string
    price: number
    compareAtPrice?: number
    stock?: number
    image: string
    variantImages?: string[]
    variantImageOptions?: ProductVariantOption[]
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
  const { getProductById } = useProducts()
  const flavourLocked = Boolean(lockedVariantImage)
  const productHref = href ?? getProductHref(product)
  const variantImages = flavourLocked ? [] : getEffectiveVariantImages(product)
  const needsVariantChoice =
    !flavourLocked && productNeedsVariantChoice(product)
  const [variantDialogOpen, setVariantDialogOpen] = useState(false)
  const [activeImage, setActiveImage] = useState(() =>
    normalizeImageUrl(
      lockedVariantImage ?? getDefaultVariantDisplayImage(product),
    ),
  )

  const variantSignature = [
    product.id,
    lockedVariantImage ?? '',
    product.image,
    ...(product.variantImageOptions ?? []).map((option) => option.url),
    ...(product.variantImages ?? []),
  ].join('|')

  useEffect(() => {
    setActiveImage(
      normalizeImageUrl(
        lockedVariantImage ?? getDefaultVariantDisplayImage(product),
      ),
    )
    // Reset only when the underlying catalogue identity/options change — not on
    // every new array reference from the parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- variantSignature
  }, [variantSignature, lockedVariantImage])

  // `displayImage` prop is only for flavour-locked expanded cards. Interactive
  // variant cards must follow `activeImage` or thumbnails cannot switch the hero.
  const displayImage = flavourLocked
    ? normalizeImageUrl(
        displayImageOverride ||
          lockedVariantImage ||
          activeImage ||
          product.image,
      )
    : normalizeImageUrl(activeImage || product.image)
  // Storefront always uses the catalogue product name. Flavour-specific titles
  // are reserved for the product page after the shopper picks a flavour.
  const displayName = displayNameOverride || product.name
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
  const fullProduct =
    getProductById(product.id) ??
    (hasAdminVariantPicker(product) ? (product as Product) : undefined)
  const cartProductId = resolveCartProductId(product, {
    variantImage: variantSelection.variantImage,
    variantLabel: variantSelection.variantLabel,
  })

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
            onSelect={(src) => setActiveImage(normalizeImageUrl(src))}
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
        <ProductPrice
          price={product.price}
          compareAtPrice={product.compareAtPrice}
          size="sm"
          className="mt-1.5 justify-center"
        />

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
                addItem(
                  resolveCartProductId(fullProduct, {
                    variantImage,
                    variantLabel,
                  }),
                  1,
                  { variantImage, variantLabel },
                )
                if (variantImage) setActiveImage(variantImage)
              }}
            />
          </>
        ) : (
          <AddToCartButton
            productId={cartProductId}
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
