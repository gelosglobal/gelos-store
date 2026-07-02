'use client'

import { Sparkles } from 'lucide-react'
import { useMemo } from 'react'
import { BundleUpsellCard } from '@/components/bundle-upsell-card'
import { useCart } from '@/components/cart-provider'
import { useProducts } from '@/components/products-provider'
import { getCheckoutBundleUpsells } from '@/lib/checkout-recommendations'
import { cn } from '@/lib/utils'

type BundleUpsellsSectionProps = {
  limit?: number
  layout?: 'carousel' | 'grid'
  className?: string
  gridClassName?: string
  /** Shop bundles page: show every active bundle, not only cart upsells. */
  showAll?: boolean
}

export function BundleUpsellsSection({
  limit = 6,
  layout = 'grid',
  className,
  gridClassName,
  showAll = false,
}: BundleUpsellsSectionProps) {
  const { items } = useCart()
  const { products, productBundles } = useProducts()

  const bundleUpsells = useMemo(
    () =>
      getCheckoutBundleUpsells(
        items,
        products,
        productBundles,
        limit,
        { showAll },
      ),
    [items, products, productBundles, limit, showAll],
  )

  if (bundleUpsells.length === 0) {
    return null
  }

  return (
    <section
      aria-labelledby="bundle-upsells-heading"
      className={cn(className)}
    >
      <div className="mb-4 flex items-center gap-2 sm:mb-6">
        <Sparkles className="size-4 text-neutral-950" />
        <h2
          id="bundle-upsells-heading"
          className="text-base font-bold text-neutral-950 sm:text-lg"
        >
          Bundle up &amp; save
        </h2>
      </div>
      <p className="mb-4 text-sm text-neutral-600 sm:mb-6">
        Curated Gelos sets — add a full routine to your cart in one tap.
      </p>

      {layout === 'carousel' ? (
        <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {bundleUpsells.map((offer) => (
            <div key={offer.id} className="w-[min(100%,19rem)] shrink-0">
              <BundleUpsellCard
                offer={offer}
                cartItems={items}
                products={products}
              />
            </div>
          ))}
        </div>
      ) : (
        <div
          className={cn(
            'grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3',
            gridClassName,
          )}
        >
          {bundleUpsells.map((offer) => (
            <BundleUpsellCard
              key={offer.id}
              offer={offer}
              cartItems={items}
              products={products}
            />
          ))}
        </div>
      )}
    </section>
  )
}
