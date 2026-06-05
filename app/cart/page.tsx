'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ShoppingBag, Tag } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useCart } from '@/components/cart-provider'
import { useLocation } from '@/components/location-provider'
import { useStorePromotions } from '@/components/store-promotions-provider'
import { CartLineItem } from '@/components/cart-line-item'
import { getProductHref } from '@/lib/product-utils'
import { useProducts } from '@/components/products-provider'
import { calculateCheckoutTotals } from '@/lib/checkout'
import { convertForLocation } from '@/lib/exchange-rates'
import {
  findActivePromo,
  interpolatePromoLabel,
  normalizePromoCode,
} from '@/lib/store-promotions'
import { cn } from '@/lib/utils'

export default function CartPage() {
  const { items, isHydrated, removeItem, setQuantity } = useCart()
  const { formatPrice, locationId } = useLocation()
  const { products } = useProducts()
  const {
    promotions,
    appliedPromoCode,
    setAppliedPromoCode,
    loading: promotionsLoading,
  } = useStorePromotions()
  const [promoCode, setPromoCode] = useState(appliedPromoCode)
  const [promoError, setPromoError] = useState('')

  useEffect(() => {
    setPromoCode(appliedPromoCode)
  }, [appliedPromoCode])

  const appliedPromo = findActivePromo(appliedPromoCode, promotions.promos)

  const { subtotal, discount, shipping, total } = calculateCheckoutTotals(
    items,
    {
      promoCode: appliedPromoCode,
      locationId,
      promotions,
    },
  )
  const afterDiscount = subtotal - discount
  const freeShippingThreshold = convertForLocation(
    promotions.freeShippingThreshold,
    locationId,
  )

  const amountToFreeShipping = Math.max(0, freeShippingThreshold - afterDiscount)
  const freeShippingProgress =
    promotions.freeShippingEnabled && freeShippingThreshold > 0
      ? Math.min(100, (afterDiscount / freeShippingThreshold) * 100)
      : 0

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

  const cartProductIds = useMemo(
    () => new Set(items.map((item) => item.id)),
    [items],
  )

  const suggestedProducts = products
    .filter((p) => !cartProductIds.has(p.id))
    .slice(0, 4)

  const enabledPromoHints = promotions.promos
    .filter((promo) => promo.enabled)
    .slice(0, 3)
    .map((promo) => promo.code)

  if (!isHydrated || promotionsLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-neutral-50 text-neutral-500">
        Loading cart…
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-foreground">
      <section className="bg-neutral-950">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Your cart
          </h1>
          <p className="mt-2 text-sm text-white/75 sm:text-base">
            {items.length > 0
              ? `${items.reduce((n, i) => n + i.quantity, 0)} item${items.reduce((n, i) => n + i.quantity, 0) === 1 ? '' : 's'} ready for checkout`
              : 'Review your picks before checkout'}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        {items.length > 0 ? (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
            <div className="space-y-4 lg:col-span-7 xl:col-span-8">
              {promotions.freeShippingEnabled ? (
                shipping === 0 ? (
                  <p className="rounded-xl bg-[#D4FF59]/30 px-4 py-3 text-sm font-medium text-[#1a2e05]">
                    {promotions.freeShippingUnlockedLabel}
                  </p>
                ) : (
                  <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3">
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-neutral-600">
                        {interpolatePromoLabel(
                          promotions.freeShippingProgressLabel,
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

              {items.map((item) => (
                <CartLineItem
                  key={item.lineKey}
                  item={item}
                  onQuantityChange={setQuantity}
                  onRemove={removeItem}
                />
              ))}

              <Link
                href="/shop"
                className="inline-flex items-center gap-2 pt-2 text-sm font-semibold text-neutral-950 hover:underline"
              >
                Continue shopping
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="lg:col-span-5 xl:col-span-4">
              <div className="sticky top-[6.5rem] space-y-4">
                <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
                  <h2 className="text-lg font-bold text-neutral-950">
                    Order summary
                  </h2>

                  <div className="mt-5 space-y-3 border-b border-neutral-100 pb-5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Subtotal</span>
                      <span className="font-medium tabular-nums">
                        {formatPrice(subtotal)}
                      </span>
                    </div>
                    {appliedPromo && discount > 0 && (
                      <div className="flex justify-between text-[#E91E8C]">
                        <span>
                          Promo ({appliedPromo.label || `${appliedPromo.discountPercent}% off`})
                        </span>
                        <span className="font-medium tabular-nums">
                          −{formatPrice(discount)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Shipping</span>
                      <span
                        className={cn(
                          'font-medium tabular-nums',
                          shipping === 0 && 'text-[#1a2e05]',
                        )}
                      >
                        {shipping === 0 ? 'Free' : formatPrice(shipping)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-5">
                    <span className="text-base font-semibold">Total</span>
                    <span className="text-2xl font-bold tabular-nums text-neutral-950">
                      {formatPrice(total)}
                    </span>
                  </div>

                  <div className="mb-5 flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => {
                          setPromoCode(e.target.value)
                          setPromoError('')
                        }}
                        placeholder="Promo code"
                        disabled={Boolean(appliedPromo)}
                        className="w-full rounded-full border border-neutral-200 bg-neutral-50 py-2.5 pr-4 pl-10 text-sm outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 disabled:opacity-60"
                      />
                    </div>
                    {appliedPromo ? (
                      <button
                        type="button"
                        onClick={clearPromo}
                        className="shrink-0 rounded-full border border-neutral-200 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-neutral-50"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={applyPromo}
                        disabled={!promoCode.trim()}
                        className="shrink-0 rounded-full border border-neutral-200 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Apply
                      </button>
                    )}
                  </div>
                  {appliedPromo ? (
                    <p className="-mt-3 mb-4 text-xs text-[#E91E8C]">
                      Code {appliedPromo.code} applied successfully.
                    </p>
                  ) : promoError ? (
                    <p className="-mt-3 mb-4 text-xs text-red-600">{promoError}</p>
                  ) : enabledPromoHints.length > 0 ? (
                    <p className="-mt-3 mb-4 text-xs text-neutral-500">
                      Try{' '}
                      {enabledPromoHints.map((code, index) => (
                        <span key={code}>
                          <button
                            type="button"
                            onClick={() => setPromoCode(code)}
                            className="font-medium text-neutral-700 underline-offset-2 hover:underline"
                          >
                            {code}
                          </button>
                          {index < enabledPromoHints.length - 1 ? ' or ' : ''}
                        </span>
                      ))}{' '}
                      for a discount.
                    </p>
                  ) : null}

                  <Link
                    href="/checkout"
                    className="flex w-full items-center justify-center rounded-full bg-neutral-950 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
                  >
                    Proceed to checkout
                  </Link>
                  <Link
                    href="/shop"
                    className="mt-3 flex w-full items-center justify-center rounded-full border border-neutral-200 py-3.5 text-sm font-semibold text-neutral-950 transition-colors hover:bg-neutral-50"
                  >
                    Continue shopping
                  </Link>

                  {promotions.freeShippingEnabled ? (
                    <p className="mt-5 text-center text-xs text-neutral-500">
                      Free {promotions.freeShippingRewardLabel} on orders over{' '}
                      {formatPrice(promotions.freeShippingThreshold)}
                    </p>
                  ) : null}
                </div>
              </div>
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

        {items.length > 0 && suggestedProducts.length > 0 && (
          <section className="mt-14 border-t border-neutral-200 pt-12">
            <h2 className="text-xl font-bold text-neutral-950">
              You might also like
            </h2>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
              {suggestedProducts.map((product) => (
                <Link
                  key={product.id}
                  href={getProductHref(product)}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-shadow hover:shadow-md"
                >
                  <div className="relative aspect-square bg-neutral-100">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover object-center transition-transform duration-300 group-hover:scale-[1.03]"
                      sizes="(max-width: 640px) 50vw, 25vw"
                    />
                  </div>
                  <div className="p-3 text-center">
                    <p className="line-clamp-2 text-xs font-medium text-neutral-950 sm:text-sm">
                      {product.name}
                    </p>
                    <p className="mt-1 text-sm font-bold text-[#E91E8C]">
                      {formatPrice(product.price)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
