'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { AlertTriangle, Package, Plus } from 'lucide-react'
import { toast } from 'sonner'
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
import {
  GELOS_CORAL,
  GELOS_CORAL_BORDER,
  GELOS_CORAL_LIGHT,
} from '@/lib/gelos-brand-colors'
import type { Product } from '@/lib/types/product'

type BundleUpsellCardProps = {
  offer: CheckoutBundleOffer
  cartItems: CartLineItem[]
  products: Product[]
}

export function BundleUpsellCard({
  offer,
  cartItems,
  products,
}: BundleUpsellCardProps) {
  const { addItems } = useCart()
  const { formatPrice } = useLocation()
  const [variantDialogOpen, setVariantDialogOpen] = useState(false)

  const missingIds = getMissingBundleProductIds(offer, cartItems, products)
  const unavailableCount = offer.unavailableProductIds?.length ?? 0
  const catalogTotal = getBundleOfferCatalogTotal(offer, products)
  const bundleTotal = getBundleOfferPrice(offer, products)
  const hasCompareAtPrice = catalogTotal > bundleTotal

  const includedProducts = offer.productIds
    .map((id) => products.find((product) => product.id === id))
    .filter((product): product is Product => Boolean(product))

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
      <article
        className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border bg-gradient-to-br to-white"
        style={{
          borderColor: GELOS_CORAL_BORDER,
          backgroundImage: `linear-gradient(to bottom right, ${GELOS_CORAL_LIGHT}, white)`,
        }}
      >
        <div className="relative h-36 overflow-hidden bg-white/70 sm:h-40">
          <Image
            src={offer.image}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 320px"
          />
          {offer.badge ? (
            <span
              className="absolute top-3 left-3 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide text-white uppercase"
              style={{ backgroundColor: GELOS_CORAL }}
            >
              {offer.badge}
            </span>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <div className="flex items-start gap-2">
            <Package
              className="mt-0.5 size-4 shrink-0"
              style={{ color: GELOS_CORAL }}
            />
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-neutral-950 sm:text-base">
                {offer.title}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-neutral-600 sm:text-sm">
                {offer.description}
              </p>
            </div>
          </div>

          {unavailableCount > 0 ? (
            <p className="mt-3 flex items-start gap-1.5 text-[11px] text-amber-700 sm:text-xs">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              {unavailableCount} product{unavailableCount === 1 ? '' : 's'} in this
              bundle {unavailableCount === 1 ? 'is' : 'are'} unavailable. Update
              the bundle in admin.
            </p>
          ) : null}

          <ul className="mt-3 space-y-1 text-[11px] text-neutral-500 sm:text-xs">
            {includedProducts.map((product) => (
              <li key={product.id} className="truncate">
                • {product.name}
                {productNeedsBundleVariantChoice(product)
                  ? ' (choose flavour)'
                  : ''}
              </li>
            ))}
          </ul>

          <div className="mt-auto flex items-end justify-between gap-3 pt-4">
            <div>
              <p className="text-[11px] text-neutral-500">Bundle price</p>
              <p className="text-base font-bold tabular-nums text-neutral-950 sm:text-lg">
                {formatPrice(bundleTotal)}
              </p>
              {hasCompareAtPrice ? (
                <p
                  className="text-[11px] font-medium line-through tabular-nums sm:text-xs"
                  style={{ color: GELOS_CORAL }}
                >
                  {formatPrice(catalogTotal)}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={addBundle}
              disabled={missingIds.length === 0}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#E5515F] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#D64555] disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:py-2.5 sm:text-sm"
            >
              <Plus className="size-3.5 sm:size-4" />
              Add bundle
            </button>
          </div>
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
