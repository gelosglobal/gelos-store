'use client'

import Link from 'next/link'
import { ChevronDown, Tag } from 'lucide-react'
import { useState } from 'react'
import { CartPaymentMethods } from '@/components/cart-payment-methods'
import { WhatsAppOrderButton } from '@/components/whatsapp-order-button'
import type { CartLineItem } from '@/components/cart-provider'
import type { PromoCode } from '@/lib/store-promotions'
import { cn } from '@/lib/utils'

type CartSummaryPanelProps = {
  items: CartLineItem[]
  itemCount: number
  total: number
  subtotal: number
  discount: number
  shipping: number
  formatPrice: (amount: number) => string
  locationLabel?: string
  promoCode: string
  promoError: string
  appliedPromo: PromoCode | null
  enabledPromoHints: string[]
  onPromoCodeChange: (value: string) => void
  onApplyPromo: () => void
  onClearPromo: () => void
}

export function CartSummaryPanel({
  items,
  itemCount,
  total,
  subtotal,
  discount,
  shipping,
  formatPrice,
  locationLabel,
  promoCode,
  promoError,
  appliedPromo,
  enabledPromoHints,
  onPromoCodeChange,
  onApplyPromo,
  onClearPromo,
}: CartSummaryPanelProps) {
  const [promoOpen, setPromoOpen] = useState(Boolean(appliedPromo))

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-base font-semibold text-neutral-950">
          Your cart ({itemCount})
        </h2>
        <p className="text-xl font-bold tabular-nums text-[#E91E8C]">
          {formatPrice(total)}
        </p>
      </div>

      {(discount > 0 || shipping > 0) && (
        <div className="mt-2 space-y-1 text-xs text-neutral-500">
          {discount > 0 ? (
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatPrice(subtotal)}</span>
            </div>
          ) : null}
          {discount > 0 ? (
            <div className="flex justify-between text-[#E91E8C]">
              <span>Promo savings</span>
              <span className="tabular-nums">−{formatPrice(discount)}</span>
            </div>
          ) : null}
          {shipping > 0 ? (
            <div className="flex justify-between">
              <span>Shipping</span>
              <span className="tabular-nums">{formatPrice(shipping)}</span>
            </div>
          ) : null}
        </div>
      )}

      <Link
        href="/checkout"
        className="mt-5 flex w-full items-center justify-center rounded-full bg-neutral-950 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
      >
        Checkout
      </Link>

      <WhatsAppOrderButton
        items={items}
        subtotal={subtotal}
        discount={discount}
        shipping={shipping}
        total={total}
        formatPrice={formatPrice}
        promoCode={appliedPromo?.code}
        locationLabel={locationLabel}
        className="mt-3"
      />

      <CartPaymentMethods />

      <div className="mt-4 border-t border-neutral-100 pt-4">
        <button
          type="button"
          onClick={() => setPromoOpen((open) => !open)}
          className="flex w-full items-center justify-between text-xs font-medium text-neutral-600 transition-colors hover:text-neutral-950"
        >
          <span className="inline-flex items-center gap-1.5">
            <Tag className="size-3.5" />
            {appliedPromo ? `Promo: ${appliedPromo.code}` : 'Have a promo code?'}
          </span>
          <ChevronDown
            className={cn(
              'size-4 transition-transform',
              promoOpen && 'rotate-180',
            )}
          />
        </button>

        {promoOpen ? (
          <div className="mt-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => onPromoCodeChange(e.target.value)}
                placeholder="Enter code"
                disabled={Boolean(appliedPromo)}
                className="min-w-0 flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 disabled:opacity-60"
              />
              {appliedPromo ? (
                <button
                  type="button"
                  onClick={onClearPromo}
                  className="shrink-0 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold transition-colors hover:bg-neutral-50"
                >
                  Remove
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onApplyPromo}
                  disabled={!promoCode.trim()}
                  className="shrink-0 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Apply
                </button>
              )}
            </div>
            {appliedPromo ? (
              <p className="mt-2 text-xs text-[#E91E8C]">
                Code {appliedPromo.code} applied.
              </p>
            ) : promoError ? (
              <p className="mt-2 text-xs text-red-600">{promoError}</p>
            ) : enabledPromoHints.length > 0 ? (
              <p className="mt-2 text-xs text-neutral-500">
                Try{' '}
                {enabledPromoHints.map((code, index) => (
                  <span key={code}>
                    <button
                      type="button"
                      onClick={() => onPromoCodeChange(code)}
                      className="font-medium text-neutral-700 underline-offset-2 hover:underline"
                    >
                      {code}
                    </button>
                    {index < enabledPromoHints.length - 1 ? ' or ' : ''}
                  </span>
                ))}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
