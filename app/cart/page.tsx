'use client'

import Link from 'next/link'
import { ArrowRight, ShoppingBag } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useCart } from '@/components/cart-provider'
import { CartItemsCard } from '@/components/cart-items-card'
import { CartSummaryPanel } from '@/components/cart-summary-panel'
import { CartUpsellBanner } from '@/components/cart-upsell-banner'
import { useCartUpsellSettings } from '@/components/cart-upsell-settings-provider'
import { useLocation } from '@/components/location-provider'
import { useMarketSettings } from '@/components/market-settings-provider'
import { trackViewCart } from '@/lib/meta-pixel'
import { useStorePromotions } from '@/components/store-promotions-provider'
import { useProducts } from '@/components/products-provider'
import { calculateCheckoutTotals } from '@/lib/checkout'
import { hasSmileRewardFreeShipping } from '@/lib/gelos-ai/smile-reward-storage'
import { convertForLocation } from '@/lib/exchange-rates'
import {
  findActivePromo,
  interpolatePromoLabel,
  normalizePromoCode,
} from '@/lib/store-promotions'
import {
  getActiveCartUpsell,
  readDismissedCartUpsells,
} from '@/lib/cart-upsells'

export default function CartPage() {
  const { items, isHydrated, removeItem, setQuantity, addItem } = useCart()
  const { formatPrice, locationId, location } = useLocation()
  const { products } = useProducts()
  const {
    promotions,
    appliedPromoCode,
    setAppliedPromoCode,
    loading: promotionsLoading,
  } = useStorePromotions()
  const { applyShipping } = useMarketSettings()
  const checkoutPromotions = applyShipping(promotions)
  const { settings: cartUpsellSettings, loading: cartUpsellsLoading } =
    useCartUpsellSettings()
  const [promoCode, setPromoCode] = useState(appliedPromoCode)
  const [promoError, setPromoError] = useState('')
  const [smileRewardFreeShipping, setSmileRewardFreeShipping] = useState(false)
  const [dismissedUpsells, setDismissedUpsells] = useState<Set<string>>(
    () => new Set(),
  )
  const cartTracked = useRef(false)

  useEffect(() => {
    setDismissedUpsells(readDismissedCartUpsells())
  }, [])

  useEffect(() => {
    setPromoCode(appliedPromoCode)
  }, [appliedPromoCode])

  useEffect(() => {
    setSmileRewardFreeShipping(hasSmileRewardFreeShipping())
  }, [])

  const appliedPromo = findActivePromo(appliedPromoCode, checkoutPromotions.promos)

  const { subtotal, discount, shipping, total } = calculateCheckoutTotals(
    items,
    {
      promoCode: appliedPromoCode,
      promotions: checkoutPromotions,
      smileRewardFreeShipping,
    },
  )
  const afterDiscount = subtotal - discount
  const freeShippingThreshold = checkoutPromotions.freeShippingThreshold

  const amountToFreeShipping = Math.max(0, freeShippingThreshold - afterDiscount)
  const freeShippingProgress =
    checkoutPromotions.freeShippingEnabled && freeShippingThreshold > 0
      ? Math.min(100, (afterDiscount / freeShippingThreshold) * 100)
      : 0

  const itemCount = items.reduce((count, item) => count + item.quantity, 0)

  useEffect(() => {
    if (!isHydrated || items.length === 0 || cartTracked.current) return
    cartTracked.current = true
    trackViewCart(
      items.map((item) => ({ id: item.id, quantity: item.quantity })),
      convertForLocation(total, locationId),
      location.currencyCode,
    )
  }, [isHydrated, items, total, locationId, location.currencyCode])

  const applyPromo = () => {
    const code = normalizePromoCode(promoCode)
    if (!code) return

    const promo = findActivePromo(code, promotions.promos)
    if (!promo) {
      setPromoError('That promo code is not valid or has expired.')
      return
    }

    setPromoError('')
    setAppliedPromoCode(code)
    setPromoCode(code)
  }

  const clearPromo = () => {
    setAppliedPromoCode('')
    setPromoCode('')
    setPromoError('')
  }

  const activeUpsell = useMemo(
    () =>
      getActiveCartUpsell(
        items,
        products,
        dismissedUpsells,
        cartUpsellSettings,
      ),
    [items, products, dismissedUpsells, cartUpsellSettings],
  )

  const handleAcceptUpsell = () => {
    if (!activeUpsell) return

    if (activeUpsell.kind === 'quantity') {
      setQuantity(activeUpsell.lineKey, activeUpsell.targetQuantity)
      toast.success(
        `Updated to ${activeUpsell.targetQuantity} — you're saving more!`,
      )
      return
    }

    addItem(activeUpsell.productId, 1)
    toast.success(`${activeUpsell.productName} added to your cart`)
  }

  const enabledPromoHints = promotions.promos
    .filter((promo) => promo.enabled)
    .slice(0, 3)
    .map((promo) => promo.code)

  if (!isHydrated || promotionsLoading || cartUpsellsLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-neutral-50 text-neutral-500">
        Loading cart…
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-100 text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
        {items.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_28rem] lg:items-start lg:gap-8">
            <div className="space-y-4">
              {checkoutPromotions.freeShippingEnabled ? (
                shipping === 0 ? (
                  <p className="rounded-xl bg-[#D4FF59]/30 px-4 py-3 text-sm font-medium text-[#1a2e05]">
                    {checkoutPromotions.freeShippingUnlockedLabel}
                  </p>
                ) : (
                  <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3">
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-neutral-600">
                        {interpolatePromoLabel(
                          checkoutPromotions.freeShippingProgressLabel,
                          {
                            amount: formatPrice(amountToFreeShipping),
                          },
                        )}
                      </span>
                      <span className="font-medium text-neutral-950">
                        {Math.round(freeShippingProgress)}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className="h-full rounded-full bg-[#84CC16] transition-all duration-500"
                        style={{ width: `${freeShippingProgress}%` }}
                      />
                    </div>
                  </div>
                )
              ) : null}

              <CartItemsCard
                items={items}
                onQuantityChange={setQuantity}
                onRemove={removeItem}
              />

              <Link
                href="/shop"
                className="inline-flex items-center gap-2 pt-1 text-sm font-semibold text-neutral-950 hover:underline"
              >
                Continue shopping
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="space-y-4 lg:sticky lg:top-[6.5rem]">
              <CartSummaryPanel
                items={items}
                itemCount={itemCount}
                total={total}
                subtotal={subtotal}
                discount={discount}
                shipping={shipping}
                formatPrice={formatPrice}
                locationLabel={location.label}
                promoCode={promoCode}
                promoError={promoError}
                appliedPromo={appliedPromo}
                enabledPromoHints={enabledPromoHints}
                onPromoCodeChange={(value) => {
                  setPromoCode(value)
                  setPromoError('')
                }}
                onApplyPromo={applyPromo}
                onClearPromo={clearPromo}
              />

              {activeUpsell ? (
                <CartUpsellBanner
                  offer={activeUpsell}
                  formatPrice={formatPrice}
                  onAccept={handleAcceptUpsell}
                  compact
                />
              ) : null}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-md rounded-3xl border border-neutral-200 bg-white px-8 py-14 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
              <ShoppingBag className="h-8 w-8 text-neutral-400" strokeWidth={1.5} />
            </div>
            <h2 className="mt-6 text-xl font-bold text-neutral-950">
              Your cart is empty
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              Explore our toothpastes, whitening kits, and daily essentials.
            </p>
            <Link
              href="/shop"
              className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-neutral-950 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
            >
              Shop all products
            </Link>
            <Link
              href="/shop?new-arrivals=true"
              className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-neutral-200 py-3.5 text-sm font-semibold text-neutral-950 transition-colors hover:bg-neutral-50"
            >
              View new arrivals
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
