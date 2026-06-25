'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  Heart,
  Lock,
  Minus,
  Plus,
  ShieldCheck,
  Tag,
  Truck,
} from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import type { CartLineItem } from '@/components/cart-provider'
import { useLocation } from '@/components/location-provider'
import { useStorePromotions } from '@/components/store-promotions-provider'
import type { CheckoutTotals } from '@/lib/checkout'
import { getProductImageDisplayClass } from '@/lib/product-image-display'
import {
  findActivePromo,
  normalizePromoCode,
  type PromoCode,
} from '@/lib/store-promotions'
import { cn } from '@/lib/utils'

type CheckoutOrderSummaryProps = {
  items: CartLineItem[]
  totals: CheckoutTotals
  onQuantityChange: (lineKey: string, quantity: number) => void
}

function getItemSubtitle(item: CartLineItem): string | null {
  if (item.variantLabel && item.variantLabel !== item.name) {
    return item.variantLabel
  }
  if (item.productName && item.productName !== item.name) {
    return item.productName
  }
  return null
}

function SummaryLineItem({
  item,
  onQuantityChange,
}: {
  item: CartLineItem
  onQuantityChange: (lineKey: string, quantity: number) => void
}) {
  const { formatPrice } = useLocation()
  const subtitle = getItemSubtitle(item)

  return (
    <li className="flex items-center gap-3 border-b border-violet-100/80 py-4 last:border-b-0">
      <div className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-neutral-200/80 bg-white sm:size-16">
        <Image
          src={item.image}
          alt={item.name}
          fill
          className={getProductImageDisplayClass(item.id, item.image)}
          sizes="64px"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-neutral-950">
          {item.name}
        </p>
        {subtitle ? (
          <p className="mt-0.5 text-xs text-neutral-500">{subtitle}</p>
        ) : null}

        <div className="mt-2 inline-flex items-center rounded-lg border border-neutral-200 bg-white">
          <button
            type="button"
            onClick={() => onQuantityChange(item.lineKey, item.quantity - 1)}
            disabled={item.quantity <= 1}
            className="rounded-l-lg p-1.5 text-neutral-500 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={`Decrease quantity of ${item.name}`}
          >
            <Minus className="size-3.5" />
          </button>
          <span className="min-w-7 px-1 text-center text-xs font-semibold tabular-nums text-neutral-950">
            {item.quantity}
          </span>
          <button
            type="button"
            onClick={() => onQuantityChange(item.lineKey, item.quantity + 1)}
            className="rounded-r-lg p-1.5 text-neutral-500 transition-colors hover:bg-neutral-50"
            aria-label={`Increase quantity of ${item.name}`}
          >
            <Plus className="size-3.5" />
          </button>
        </div>
      </div>

      <p className="shrink-0 text-sm font-semibold tabular-nums text-neutral-950">
        {formatPrice(item.price * item.quantity)}
      </p>
    </li>
  )
}

function TrustBadge({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode
  title: string
  subtitle: string
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      <div className="flex size-9 items-center justify-center rounded-full bg-violet-100 text-violet-700">
        {icon}
      </div>
      <p className="text-[10px] font-semibold leading-tight text-neutral-800 sm:text-[11px]">
        {title}
      </p>
      <p className="text-[9px] leading-tight text-neutral-500 sm:text-[10px]">
        {subtitle}
      </p>
    </div>
  )
}

export function CheckoutOrderSummary({
  items,
  totals,
  onQuantityChange,
}: CheckoutOrderSummaryProps) {
  const { formatPrice } = useLocation()
  const {
    promotions,
    appliedPromoCode,
    setAppliedPromoCode,
  } = useStorePromotions()
  const [promoCode, setPromoCode] = useState(appliedPromoCode)
  const [promoError, setPromoError] = useState('')

  useEffect(() => {
    setPromoCode(appliedPromoCode)
  }, [appliedPromoCode])

  const appliedPromo: PromoCode | null = findActivePromo(
    appliedPromoCode,
    promotions.promos,
  )
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  const applyPromo = () => {
    const code = normalizePromoCode(promoCode)
    if (!code) return

    const promo = findActivePromo(code, promotions.promos)
    if (!promo) {
      setPromoError('That discount code is not valid or has expired.')
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

  return (
    <aside className="h-fit w-full lg:sticky lg:top-24">
      <div className="w-full overflow-hidden rounded-3xl border border-violet-100 bg-[#FFF7FA] shadow-sm">
        <div className="border-b border-violet-100/80 px-5 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-neutral-950 sm:text-lg">
              Your Order ({itemCount} {itemCount === 1 ? 'item' : 'items'})
            </h2>
            <Link
              href="/cart"
              className="shrink-0 text-sm font-semibold text-violet-600 transition-colors hover:text-violet-800"
            >
              Edit Cart
            </Link>
          </div>
        </div>

        <ul className="px-5 sm:px-6">
          {items.map((item) => (
            <SummaryLineItem
              key={item.lineKey}
              item={item}
              onQuantityChange={onQuantityChange}
            />
          ))}
        </ul>

        <div className="space-y-4 border-t border-violet-100/80 px-5 py-5 sm:px-6">
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <Tag className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={promoCode}
                onChange={(event) => {
                  setPromoCode(event.target.value)
                  setPromoError('')
                }}
                placeholder="Discount code"
                disabled={Boolean(appliedPromo)}
                className="w-full rounded-xl border border-violet-100 bg-white py-2.5 pr-3 pl-10 text-sm outline-none placeholder:text-neutral-400 focus:border-violet-300 focus:ring-2 focus:ring-violet-100 disabled:opacity-60"
              />
            </div>
            {appliedPromo ? (
              <button
                type="button"
                onClick={clearPromo}
                className="shrink-0 rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-sm font-semibold text-violet-700 transition-colors hover:bg-violet-50"
              >
                Remove
              </button>
            ) : (
              <button
                type="button"
                onClick={applyPromo}
                disabled={!promoCode.trim()}
                className="shrink-0 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Apply
              </button>
            )}
          </div>
          {promoError ? (
            <p className="text-xs text-red-600">{promoError}</p>
          ) : appliedPromo ? (
            <p className="text-xs font-medium text-[#E91E8C]">
              Code {appliedPromo.code} applied.
            </p>
          ) : null}

          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-600">Subtotal</dt>
              <dd className="font-medium tabular-nums text-neutral-950">
                {formatPrice(totals.subtotal)}
              </dd>
            </div>
            {totals.discount > 0 ? (
              <div className="flex justify-between gap-4 text-[#E91E8C]">
                <dt>
                  {appliedPromo
                    ? `Discount (${appliedPromo.label || appliedPromo.code})`
                    : 'Discount'}
                </dt>
                <dd className="font-medium tabular-nums">
                  − {formatPrice(totals.discount)}
                </dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-600">Shipping</dt>
              <dd
                className={cn(
                  'font-semibold tabular-nums uppercase tracking-wide',
                  totals.shipping === 0
                    ? 'text-violet-600'
                    : 'text-neutral-950',
                )}
              >
                {totals.shipping === 0 ? 'Free' : formatPrice(totals.shipping)}
              </dd>
            </div>
          </dl>

          <div className="flex items-end justify-between gap-4 border-t border-violet-100 pt-4">
            <p className="text-sm font-semibold text-neutral-950">
              Total <span className="font-normal text-neutral-500">(VAT Included)</span>
            </p>
            <p className="text-2xl font-bold tabular-nums text-neutral-950">
              {formatPrice(totals.total)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-violet-100/80 bg-white/60 px-4 py-5 sm:gap-4 sm:px-5">
          <TrustBadge
            icon={<Truck className="size-4" />}
            title="Free Delivery"
            subtitle={
              promotions.freeShippingEnabled
                ? `Over ${formatPrice(promotions.freeShippingThreshold)}`
                : 'On eligible orders'
            }
          />
          <TrustBadge
            icon={<Lock className="size-4" />}
            title="Secure Checkout"
            subtitle="100% Safe"
          />
          <TrustBadge
            icon={<ShieldCheck className="size-4" />}
            title="30-Day Guarantee"
            subtitle="Love it or refund"
          />
          <TrustBadge
            icon={<Heart className="size-4" />}
            title="Made with Love"
            subtitle="In Ghana 🇬🇭"
          />
        </div>
      </div>
    </aside>
  )
}
