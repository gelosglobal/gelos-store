'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { BundleProductThumbnails } from '@/components/bundle-product-thumbnails'
import { BundleVariantDialog } from '@/components/bundle-variant-dialog'
import type { CartLineItem } from '@/components/cart-provider'
import { useCart } from '@/components/cart-provider'
import { useLocation } from '@/components/location-provider'
import {
  getBundleOfferCatalogTotal,
  getBundleOfferPrice,
  getMissingBundleProductIds,
  type CheckoutBundleOffer,
} from '@/lib/checkout-recommendations'
import { productNeedsBundleVariantChoice } from '@/lib/bundle-variant-selection'
import { getBundleLineUnitPrice } from '@/lib/product-bundle-pricing'
import { getBundleAddToCartOptions } from '@/lib/cart-merge-requests'
import { getDefaultVariantDisplayImage } from '@/lib/product-variant-images'
import { getProductDisplayBadge } from '@/lib/product-tags'
import { getProductImageDisplayClass } from '@/lib/product-image-display'
import { isExternalImageUrl } from '@/lib/image-url'
import type { Product } from '@/lib/types/product'

type BundleUpsellCardProps = {
  offer: CheckoutBundleOffer
  cartItems: CartLineItem[]
  products: Product[]
}

function getBundleDisplayImage(offer: CheckoutBundleOffer): string {
  return offer.image || '/gelos/watermelon2.jpeg'
}

export function BundleUpsellCard({
  offer,
  cartItems,
  products,
}: BundleUpsellCardProps) {
  const { addItems } = useCart()
  const { formatPrice } = useLocation()
  const router = useRouter()
  const [variantDialogOpen, setVariantDialogOpen] = useState(false)

  const missingIds = getMissingBundleProductIds(offer, cartItems, products)
  const unavailableCount = offer.unavailableProductIds?.length ?? 0
  const catalogTotal = getBundleOfferCatalogTotal(offer, products)
  const bundleTotal = getBundleOfferPrice(offer, products)
  const hasCompareAtPrice = catalogTotal > bundleTotal

  const includedProducts = useMemo(
    () =>
      offer.productIds
        .map((id) => products.find((product) => product.id === id))
        .filter((product): product is Product => Boolean(product)),
    [offer.productIds, products],
  )

  const defaultImage = getBundleDisplayImage(offer)
  const [activeImage, setActiveImage] = useState(defaultImage)

  useEffect(() => {
    setActiveImage(getBundleDisplayImage(offer))
  }, [offer.id, offer.image])

  const isShowingBundleCover = activeImage === offer.image

  const activeProduct = useMemo(
    () =>
      includedProducts.find(
        (product) => getDefaultVariantDisplayImage(product) === activeImage,
      ),
    [activeImage, includedProducts],
  )

  const activeProductBadge = activeProduct
    ? getProductDisplayBadge(activeProduct)
    : undefined

  const imageBadges = useMemo(() => {
    const badges: string[] = []
    if (offer.badge?.trim()) badges.push(offer.badge.trim())
    if (
      activeProductBadge &&
      !badges.some(
        (badge) => badge.toLowerCase() === activeProductBadge.toLowerCase(),
      )
    ) {
      badges.push(activeProductBadge)
    }
    return badges
  }, [offer.badge, activeProductBadge])

  const variantChoiceProducts = useMemo(
    () =>
      missingIds
        .map((id) => products.find((product) => product.id === id))
        .filter(
          (product): product is Product =>
            Boolean(product && productNeedsBundleVariantChoice(product)),
        ),
    [missingIds, products],
  )

  const commitAddBundle = (variantSelections: Record<string, string> = {}) => {
    if (missingIds.length === 0) return

    const bundlePrice = getBundleOfferPrice(offer, products)
    const result = addItems(
      missingIds.map((productId) => {
        const product = products.find((item) => item.id === productId)
        const unitPrice = getBundleLineUnitPrice(
          productId,
          bundlePrice,
          offer.productIds,
          products,
        )

        return {
          productId,
          quantity: 1,
          options: product
            ? getBundleAddToCartOptions(
                product,
                unitPrice,
                variantSelections[productId],
              )
            : unitPrice !== undefined
              ? { unitPrice }
              : undefined,
        }
      }),
      { silent: true },
    )

    if (result.added === 0) {
      toast.error(
        result.skipped > 0
          ? 'Bundle items are out of stock or unavailable.'
          : 'Could not add this bundle to your cart.',
      )
      return
    }

    toast.success(
      result.added === offer.productIds.length && result.skipped === 0
        ? `${offer.title} added to your cart`
        : `Added ${result.added} item${result.added === 1 ? '' : 's'} to your cart`,
    )

    if (result.skipped > 0) {
      toast.error(
        `${result.skipped} item${result.skipped === 1 ? '' : 's'} in this bundle ${result.skipped === 1 ? 'is' : 'are'} out of stock.`,
      )
    }

    router.push('/cart')
  }

  const addBundle = () => {
    if (missingIds.length === 0) return

    if (variantChoiceProducts.length > 0) {
      setVariantDialogOpen(true)
      return
    }

    commitAddBundle()
  }

  return (
    <>
      <article className="flex h-full min-w-0 flex-col">
        {isShowingBundleCover ? (
          <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50">
            <Image
              key={activeImage}
              src={activeImage}
              alt={offer.title}
              width={1600}
              height={1067}
              className="block h-auto w-full"
              style={{ width: '100%', height: 'auto' }}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 50vw"
              unoptimized={isExternalImageUrl(activeImage)}
            />
            <BundleProductThumbnails
              products={includedProducts}
              bundleImage={offer.image}
              activeImage={activeImage}
              onSelect={setActiveImage}
            />
            {imageBadges.length > 0 ? (
              <div className="pointer-events-none absolute left-1/2 top-3 z-20 flex -translate-x-1/2 flex-col items-center gap-1.5">
                {imageBadges.map((badge) => (
                  <span
                    key={badge}
                    className="whitespace-nowrap rounded-full bg-neutral-950 px-3 py-1 text-[11px] font-semibold tracking-wide text-white shadow-md"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            <Image
              key={activeImage}
              src={activeImage}
              alt={offer.title}
              fill
              className={getProductImageDisplayClass(
                activeProduct?.id ?? offer.id,
                activeImage,
                'transition-transform duration-300',
              )}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              unoptimized={isExternalImageUrl(activeImage)}
            />

            <BundleProductThumbnails
              products={includedProducts}
              bundleImage={offer.image}
              activeImage={activeImage}
              onSelect={setActiveImage}
            />

            {imageBadges.length > 0 ? (
              <div className="pointer-events-none absolute left-1/2 top-3 z-20 flex -translate-x-1/2 flex-col items-center gap-1.5">
                {imageBadges.map((badge) => (
                  <span
                    key={badge}
                    className="whitespace-nowrap rounded-full bg-neutral-950 px-3 py-1 text-[11px] font-semibold tracking-wide text-white shadow-md"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        )}

        <div className="flex flex-1 flex-col items-center px-2 pt-3 text-center">
          <h3 className="text-sm font-medium leading-snug text-neutral-950">
            {offer.title}
          </h3>

          <div className="mt-1 flex items-baseline justify-center gap-2">
            <p className="text-sm font-bold tabular-nums text-neutral-950">
              {formatPrice(bundleTotal)}
            </p>
            {hasCompareAtPrice ? (
              <p className="text-xs font-medium text-neutral-500 line-through tabular-nums sm:text-sm">
                {formatPrice(catalogTotal)}
              </p>
            ) : null}
          </div>

          {unavailableCount > 0 ? (
            <p className="mt-2 flex items-start justify-center gap-1.5 text-[11px] text-amber-700 sm:text-xs">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              {unavailableCount} product{unavailableCount === 1 ? '' : 's'}{' '}
              unavailable
            </p>
          ) : null}

          <button
            type="button"
            onClick={addBundle}
            disabled={missingIds.length === 0}
            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-neutral-950 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
          >
            <Plus className="size-3.5 sm:size-4" />
            Add bundle
          </button>
        </div>
      </article>

      <BundleVariantDialog
        open={variantDialogOpen}
        onOpenChange={setVariantDialogOpen}
        bundleTitle={offer.title}
        products={variantChoiceProducts}
        onConfirm={commitAddBundle}
      />
    </>
  )
}
