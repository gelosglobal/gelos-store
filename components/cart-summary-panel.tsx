'use client'

import Link from 'next/link'
import { ChevronDown, Loader2, Tag } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { CartPaymentMethods } from '@/components/cart-payment-methods'
import { WhatsAppOrderButton } from '@/components/whatsapp-order-button'
import type { CartLineItem } from '@/components/cart-provider'
import { useLocation } from '@/components/location-provider'
import { trackInitiateCheckout } from '@/lib/meta-pixel'
import { getInitiateCheckoutEventId } from '@/lib/meta-event-ids'
import { getOrCreateVisitorId } from '@/lib/visitor-id'
import { convertForLocation } from '@/lib/exchange-rates'
import { startShopifyCheckout } from '@/lib/shopify/start-checkout-client'
import {
  shopifyCountryCodeFromLocation,
  useShopifyCommerce,
} from '@/lib/shopify/use-shopify-commerce'
import type { PromoCode } from '@/lib/store-promotions'
import { cn } from '@/lib/utils'

const CHECKOUT_CONTACT_KEY = 'gelos:checkout-contact'

type SavedCheckoutContact = {
  email?: string
  phone?: string
}

function readSavedContact(): SavedCheckoutContact {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(CHECKOUT_CONTACT_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as SavedCheckoutContact
    return {
      email: typeof parsed.email === 'string' ? parsed.email : '',
      phone: typeof parsed.phone === 'string' ? parsed.phone : '',
    }
  } catch {
    return {}
  }
}

function saveContact(email: string, phone: string) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      CHECKOUT_CONTACT_KEY,
      JSON.stringify({ email, phone }),
    )
  } catch {
    // ignore quota / private mode
  }
}

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
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [checkoutEmail, setCheckoutEmail] = useState('')
  const [checkoutPhone, setCheckoutPhone] = useState('')
  const { enabled: shopifyCheckoutEnabled, isLoading: shopifyStatusLoading } =
    useShopifyCommerce()
  const { locationId, location } = useLocation()

  useEffect(() => {
    const saved = readSavedContact()
    if (saved.email) setCheckoutEmail(saved.email)
    if (saved.phone) setCheckoutPhone(saved.phone)
  }, [])

  const handleShopifyCheckout = async () => {
    if (isRedirecting || items.length === 0) return

    const email = checkoutEmail.trim().toLowerCase()
    const phone = checkoutPhone.trim()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Enter a valid email so we can send order updates')
      return
    }

    setIsRedirecting(true)
    saveContact(email, phone)

    try {
      const visitorId = getOrCreateVisitorId()
      const eventId = getInitiateCheckoutEventId(visitorId)
      const value = convertForLocation(total, locationId)

      trackInitiateCheckout(
        items.map((item) => ({ id: item.id, quantity: item.quantity })),
        value,
        location.currencyCode,
        eventId,
      )

      const checkoutUrl = await startShopifyCheckout({
        items,
        countryCode: shopifyCountryCodeFromLocation(locationId),
        locationId,
        email,
        phone: phone || undefined,
        visitorId,
        eventId,
        eventSourceUrl:
          typeof window !== 'undefined' ? window.location.href : undefined,
        total: value,
        currency: location.currencyCode,
      })
      window.location.href = checkoutUrl
    } catch (error) {
      setIsRedirecting(false)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Could not start Shopify checkout',
      )
    }
  }

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

      {shopifyCheckoutEnabled ? (
        <div className="mt-5 space-y-3">
          <div>
            <label
              htmlFor="cart-checkout-email"
              className="text-xs font-medium text-neutral-600"
            >
              Email for order updates
            </label>
            <input
              id="cart-checkout-email"
              type="email"
              autoComplete="email"
              required
              value={checkoutEmail}
              onChange={(e) => setCheckoutEmail(e.target.value)}
              placeholder="you@email.com"
              className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950"
            />
          </div>
          <div>
            <label
              htmlFor="cart-checkout-phone"
              className="text-xs font-medium text-neutral-600"
            >
              Phone{' '}
              <span className="font-normal text-neutral-400">(optional)</span>
            </label>
            <input
              id="cart-checkout-phone"
              type="tel"
              autoComplete="tel"
              value={checkoutPhone}
              onChange={(e) => setCheckoutPhone(e.target.value)}
              placeholder="e.g. 053 962 1338"
              className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950"
            />
          </div>
          <button
            type="button"
            onClick={() => void handleShopifyCheckout()}
            disabled={isRedirecting || shopifyStatusLoading || items.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-neutral-950 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isRedirecting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Redirecting to checkout…
              </>
            ) : (
              'Checkout'
            )}
          </button>
        </div>
      ) : (
        <Link
          href="/checkout"
          className="mt-5 flex w-full items-center justify-center rounded-full bg-neutral-950 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
        >
          Checkout
        </Link>
      )}

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
