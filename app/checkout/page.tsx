'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Banknote, Loader2, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { useCart } from '@/components/cart-provider'
import { CheckoutOrderSummary } from '@/components/checkout-order-summary'
import { CheckoutUpsells } from '@/components/checkout-upsells'
import { useLocation } from '@/components/location-provider'
import { useStorePromotions } from '@/components/store-promotions-provider'
import { useAffiliate } from '@/components/affiliate-provider'
import { calculateCheckoutTotals } from '@/lib/checkout'
import { hasSmileRewardFreeShipping } from '@/lib/gelos-ai/smile-reward-storage'
import { trackInitiateCheckout, trackPurchase, trackAddPaymentInfo } from '@/lib/meta-pixel'
import { cn } from '@/lib/utils'

type PaymentMethod = 'paystack' | 'cod'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, isHydrated, clearCart, setQuantity } = useCart()
  const { location, locationId } = useLocation()
  const { promotions, appliedPromoCode } = useStorePromotions()
  const { affiliateCode, affiliate } = useAffiliate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [shippingAddress, setShippingAddress] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('paystack')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [smileRewardFreeShipping, setSmileRewardFreeShipping] = useState(false)
  const checkoutTracked = useRef(false)

  useEffect(() => {
    setSmileRewardFreeShipping(hasSmileRewardFreeShipping())
  }, [])

  const totals = useMemo(
    () =>
      calculateCheckoutTotals(items, {
        promoCode: appliedPromoCode,
        locationId,
        promotions,
        smileRewardFreeShipping,
      }),
    [items, locationId, appliedPromoCode, promotions, smileRewardFreeShipping],
  )

  useEffect(() => {
    if (!isHydrated || items.length === 0 || checkoutTracked.current) return
    checkoutTracked.current = true
    trackInitiateCheckout(
      items.map((item) => ({ id: item.id, quantity: item.quantity })),
      totals.total,
      location.currencyCode,
    )
  }, [isHydrated, items, totals.total, location.currencyCode])

  const checkoutPayload = {
    name: name.trim(),
    email: email.trim(),
    phone: phone.trim() || undefined,
    shippingAddress: shippingAddress.trim() || undefined,
    locationId,
    items: items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      variantImage: item.variantImage,
      variantLabel: item.variantLabel,
    })),
    promoCode: appliedPromoCode || undefined,
    affiliateCode: affiliateCode || undefined,
    smileRewardFreeShipping: smileRewardFreeShipping || undefined,
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (items.length === 0) {
      toast.error('Your cart is empty')
      router.push('/cart')
      return
    }

    if (paymentMethod === 'cod') {
      if (!phone.trim()) {
        toast.error('Phone number is required for cash on delivery')
        return
      }
      if (!shippingAddress.trim()) {
        toast.error('Delivery address is required for cash on delivery')
        return
      }
    }

    setIsSubmitting(true)

    const pixelItems = items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
    }))

    trackAddPaymentInfo(
      pixelItems,
      totals.total,
      location.currencyCode,
      paymentMethod,
    )

    try {
      if (paymentMethod === 'cod') {
        const response = await fetch('/api/checkout/cod', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(checkoutPayload),
        })

        const data = (await response.json()) as {
          ok?: boolean
          error?: string
          order?: {
            orderNumber: string
            total: number
            currency: string
          }
        }

        if (!response.ok || !data.ok || !data.order) {
          throw new Error(data.error ?? 'Could not place order')
        }

        trackPurchase({
          value: data.order.total,
          currency: data.order.currency,
          orderId: data.order.orderNumber,
          items: items.map((item) => ({
            id: item.id,
            quantity: item.quantity,
          })),
        })

        clearCart()
        router.push(
          `/checkout/success?method=cod&order=${encodeURIComponent(data.order.orderNumber)}&total=${data.order.total}`,
        )
        return
      }

      const response = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkoutPayload),
      })

      const data = (await response.json()) as {
        authorizationUrl?: string
        error?: string
      }

      if (!response.ok || !data.authorizationUrl) {
        throw new Error(data.error ?? 'Could not start payment')
      }

      window.location.href = data.authorizationUrl
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Checkout could not be completed'
      toast.error(message)
      setIsSubmitting(false)
    }
  }

  if (!isHydrated) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-neutral-50 text-neutral-500">
        Loading checkout…
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50 px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-neutral-950">Nothing to checkout</h1>
        <p className="mt-3 text-neutral-600">Add items to your cart first.</p>
        <Link
          href="/shop"
          className="mt-6 inline-flex rounded-full bg-neutral-950 px-8 py-3 text-sm font-semibold text-white"
        >
          Browse shop
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mb-8">
          <p className="text-sm text-neutral-500">Secure checkout</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-950">
            Checkout
          </h1>
          {affiliate && (
            <p className="mt-2 text-sm text-neutral-600">
              Referred by <span className="font-medium">{affiliate.name}</span>{' '}
              <span className="font-mono text-neutral-500">({affiliate.code})</span>
            </p>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-2 lg:items-start lg:gap-12">
          <form
            onSubmit={handleSubmit}
            className="min-w-0 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8"
          >
            <h2 className="text-lg font-semibold text-neutral-950">
              Contact & delivery
            </h2>

            <div className="mt-6 space-y-4">
              <div>
                <label htmlFor="checkout-name" className="text-sm font-medium">
                  Full name
                </label>
                <input
                  id="checkout-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950"
                />
              </div>

              <div>
                <label htmlFor="checkout-email" className="text-sm font-medium">
                  Email
                </label>
                <input
                  id="checkout-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950"
                />
              </div>

              <div>
                <label htmlFor="checkout-phone" className="text-sm font-medium">
                  Phone
                  {paymentMethod === 'cod' ? (
                    <span className="text-[#E91E8C]"> *</span>
                  ) : null}
                </label>
                <input
                  id="checkout-phone"
                  type="tel"
                  required={paymentMethod === 'cod'}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="For delivery updates"
                  className="mt-1.5 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950"
                />
              </div>

              <div>
                <label htmlFor="checkout-address" className="text-sm font-medium">
                  Delivery address
                  {paymentMethod === 'cod' ? (
                    <span className="text-[#E91E8C]"> *</span>
                  ) : null}
                </label>
                <textarea
                  id="checkout-address"
                  rows={3}
                  required={paymentMethod === 'cod'}
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Street, city, region"
                  className="mt-1.5 w-full resize-none rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950"
                />
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-lg font-semibold text-neutral-950">
                Payment method
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('paystack')}
                  className={cn(
                    'rounded-2xl border px-4 py-4 text-left transition-colors',
                    paymentMethod === 'paystack'
                      ? 'border-neutral-950 bg-neutral-50'
                      : 'border-neutral-200 hover:border-neutral-400',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Lock className="size-4" />
                    <span className="text-sm font-semibold">Pay online</span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">
                    Card, mobile money & bank via Paystack
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={cn(
                    'rounded-2xl border px-4 py-4 text-left transition-colors',
                    paymentMethod === 'cod'
                      ? 'border-neutral-950 bg-neutral-50'
                      : 'border-neutral-200 hover:border-neutral-400',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Banknote className="size-4" />
                    <span className="text-sm font-semibold">Cash on delivery</span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">
                    Pay with cash when your order arrives
                  </p>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-neutral-950 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {paymentMethod === 'cod'
                    ? 'Placing order…'
                    : 'Redirecting to Paystack…'}
                </>
              ) : paymentMethod === 'cod' ? (
                <>
                  <Banknote className="size-4" />
                  Place order — cash on delivery
                </>
              ) : (
                <>
                  <Lock className="size-4" />
                  Pay with Paystack
                </>
              )}
            </button>

            <p className="mt-4 text-center text-xs text-neutral-500">
              {paymentMethod === 'cod' ? (
                <>You&apos;ll pay in cash when your order is delivered.</>
              ) : (
                <>
                  You&apos;ll be charged in{' '}
                  <span className="font-medium text-neutral-700">
                    {location.currencyCode}
                  </span>{' '}
                  via Paystack ({location.label}).
                </>
              )}
            </p>
          </form>

          <div className="w-full min-w-0 lg:min-w-[24rem]">
            <CheckoutOrderSummary
              items={items}
              totals={totals}
              onQuantityChange={setQuantity}
            />
          </div>
        </div>

        <div className="mt-8 lg:mt-10">
          <CheckoutUpsells cartItems={items} />
        </div>
      </div>
    </div>
  )
}
