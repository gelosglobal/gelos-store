'use client'

import Image from 'next/image'
import { Package, Plus } from 'lucide-react'
import { toast } from 'sonner'
import type { CartLineItem } from '@/components/cart-provider'
import { useCart } from '@/components/cart-provider'
import { useLocation } from '@/components/location-provider'
import {
  getMissingBundleProductIds,
  sumProductPrices,
  type CheckoutBundleOffer,
} from '@/lib/checkout-recommendations'
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
  const { addItem } = useCart()
  const { formatPrice } = useLocation()
  const missingIds = getMissingBundleProductIds(offer, cartItems)
  const bundleTotal = sumProductPrices(offer.productIds, products)
  const missingTotal = sumProductPrices(missingIds, products)

  const includedNames = offer.productIds
    .map((id) => products.find((product) => product.id === id)?.name)
    .filter((name): name is string => Boolean(name))

  const addBundle = () => {
    if (missingIds.length === 0) return

    for (const productId of missingIds) {
      addItem(productId, 1)
    }

    toast.success(
      missingIds.length === offer.productIds.length
        ? `${offer.title} added to your cart`
        : `Added ${missingIds.length} item${missingIds.length === 1 ? '' : 's'} to complete your bundle`,
    )
  }

  return (
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/90 to-[#FFF7FA]">
      <div className="relative h-36 overflow-hidden bg-white/70 sm:h-40">
        <Image
          src={offer.image}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 320px"
        />
        {offer.badge ? (
          <span className="absolute top-3 left-3 rounded-full bg-violet-600 px-2.5 py-1 text-[10px] font-bold tracking-wide text-white uppercase">
            {offer.badge}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-start gap-2">
          <Package className="mt-0.5 size-4 shrink-0 text-violet-600" />
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-neutral-950 sm:text-base">
              {offer.title}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-neutral-600 sm:text-sm">
              {offer.description}
            </p>
          </div>
        </div>

        <ul className="mt-3 space-y-1 text-[11px] text-neutral-500 sm:text-xs">
          {includedNames.map((name) => (
            <li key={name} className="truncate">
              • {name}
            </li>
          ))}
        </ul>

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div>
            <p className="text-[11px] text-neutral-500">Bundle price</p>
            <p className="text-base font-bold tabular-nums text-neutral-950 sm:text-lg">
              {formatPrice(bundleTotal)}
            </p>
            {missingIds.length < offer.productIds.length ? (
              <p className="text-[11px] font-medium text-violet-600 sm:text-xs">
                +{formatPrice(missingTotal)} to complete
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={addBundle}
            disabled={missingIds.length === 0}
            className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:py-2.5 sm:text-sm"
          >
            <Plus className="size-3.5 sm:size-4" />
            Add bundle
          </button>
        </div>
      </div>
    </article>
  )
}
