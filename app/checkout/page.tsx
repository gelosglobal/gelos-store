'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePageResume } from '@/hooks/use-page-resume'
import { Banknote, Loader2, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { useCart } from '@/components/cart-provider'
import { CheckoutOrderSummary } from '@/components/checkout-order-summary'
import { CheckoutUpsells } from '@/components/checkout-upsells'
import { useLocation } from '@/components/location-provider'
import { useStorePromotions } from '@/components/store-promotions-provider'
import { useAffiliate } from '@/components/affiliate-provider'
import { useMarketSettings } from '@/components/market-settings-provider'
import {
  CardBrandBadges,
  StripeCardFields,
  StripeElementsProvider,
  type StripeCardFieldsHandle,
} from '@/components/stripe-card-fields'
import { PaystackPaymentBadges } from '@/components/paystack-payment-badges'
import { calculateCheckoutTotals } from '@/lib/checkout'
import { localizeCheckoutTotals } from '@/lib/dhl/prices'
import type { DhlRateOption } from '@/lib/dhl/types'
import {
  toPaystackChargeCurrency,
} from '@/lib/exchange-rates'
import { hasSmileRewardFreeShipping } from '@/lib/gelos-ai/smile-reward-storage'
import { trackInitiateCheckout, trackPurchase, trackAddPaymentInfo } from '@/lib/meta-pixel'
import { getInitiateCheckoutEventId } from '@/lib/meta-event-ids'
import { saveCheckoutDraft } from '@/lib/checkout-draft'
import {
  countryCodeFromLocation,
  internationalCountryOptions,
} from '@/lib/shipping-destination'
import { countryRequiresPostalCode } from '@/lib/dhl/locations'
import { formatDhlDeliveryDate } from '@/lib/dhl/text'
import { trackVisitorFunnelEvent } from '@/lib/visitor-funnel'
import { getOrCreateVisitorId } from '@/lib/visitor-id'
import {
  shopifyCountryCodeFromLocation,
  useShopifyCommerce,
} from '@/lib/shopify/use-shopify-commerce'
import { startShopifyCheckout } from '@/lib/shopify/start-checkout-client'
import { usesLiveDhlRates } from '@/lib/market-settings'
import { cn } from '@/lib/utils'

type PaymentMethod = 'paystack' | 'stripe' | 'cod' | 'shopify'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, isHydrated, clearCart, setQuantity } = useCart()
  const { location, locationId, geo, countryCode: geoCountryCode } = useLocation()
  const { promotions, appliedPromoCode } = useStorePromotions()
  const { market, applyShipping, isProductAvailable } = useMarketSettings()
  const { affiliateCode, affiliate } = useAffiliate()
  const { enabled: shopifyCheckoutEnabled, isLoading: shopifyStatusLoading } =
    useShopifyCommerce()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [addressLine, setAddressLine] = useState('')
  const [city, setCity] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [countryCode, setCountryCode] = useState(
    () => countryCodeFromLocation(locationId) ?? '',
  )
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('paystack')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [smileRewardFreeShipping, setSmileRewardFreeShipping] = useState(false)
  const [dhlConfigured, setDhlConfigured] = useState(false)
  const [dhlLoading, setDhlLoading] = useState(false)
  const [dhlError, setDhlError] = useState('')
  const [dhlQuote, setDhlQuote] = useState<DhlRateOption | null>(null)
  const [dhlDeliveryDate, setDhlDeliveryDate] = useState<string | undefined>()
  const [dhlAddressWarning, setDhlAddressWarning] = useState('')
  const checkoutTracked = useRef(false)
  const stripeCardRef = useRef<StripeCardFieldsHandle>(null)
  const checkoutPromotions = applyShipping(promotions)
  const liveDhl = usesLiveDhlRates(locationId)
  const destinationCountry = (
    countryCode.trim() ||
    countryCodeFromLocation(locationId) ||
    ''
  ).toUpperCase()
  const postalRequired =
    liveDhl && countryRequiresPostalCode(destinationCountry)
  const cartHasUnavailableItems = items.some(
    (item) => !isProductAvailable(item.id),
  )

  const shippingAddress = useMemo(() => {
    const parts = [
      addressLine.trim(),
      city.trim(),
      postalCode.trim(),
      (countryCode || countryCodeFromLocation(locationId) || '').trim(),
    ].filter(Boolean)
    return parts.join(', ')
  }, [addressLine, city, postalCode, countryCode, locationId])

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  )

  useEffect(() => {
    setSmileRewardFreeShipping(hasSmileRewardFreeShipping())
  }, [])

  useEffect(() => {
    const marketCountry = countryCodeFromLocation(locationId)
    if (marketCountry) {
      setCountryCode(marketCountry)
      return
    }
    if (locationId !== 'international') return
    const detected =
      geo?.locationId === 'international' ? geo.countryCode : undefined
    setCountryCode((current) => {
      if (!current || current === 'GH' || current === 'US') {
        return detected || 'GB'
      }
      return current
    })
  }, [locationId, geo?.countryCode, geo?.locationId])

  useEffect(() => {
    let cancelled = false
    void fetch('/api/dhl/rates', { cache: 'no-store' })
      .then(async (res) => {
        const data = (await res.json()) as { configured?: boolean }
        if (!cancelled) setDhlConfigured(Boolean(data.configured))
      })
      .catch(() => {
        if (!cancelled) setDhlConfigured(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!dhlConfigured || !liveDhl) {
      setDhlQuote(null)
      setDhlDeliveryDate(undefined)
      setDhlError('')
      setDhlAddressWarning('')
      return
    }

    const destination =
      countryCode.trim().toUpperCase() ||
      countryCodeFromLocation(locationId) ||
      ''
    const cityName = city.trim()

    if (!destination || cityName.length < 2) {
      setDhlQuote(null)
      setDhlDeliveryDate(undefined)
      setDhlError('')
      setDhlAddressWarning('')
      return
    }

    if (countryRequiresPostalCode(destination) && postalCode.trim().length < 3) {
      setDhlQuote(null)
      setDhlDeliveryDate(undefined)
      setDhlError(
        destination === 'US'
          ? 'Enter a ZIP code for US delivery rates'
          : 'Enter a postal code for DHL rates to this country',
      )
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      setDhlLoading(true)
      setDhlError('')
      void fetch('/api/dhl/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          destinationCountryCode: destination,
          destinationCityName: cityName,
          destinationPostalCode: postalCode.trim() || undefined,
          destinationAddressLine1: addressLine.trim() || undefined,
          itemCount,
        }),
      })
        .then(async (res) => {
          const data = (await res.json()) as {
            ok?: boolean
            error?: string
            selected?: DhlRateOption
            address?: { valid?: boolean; message?: string }
          }
          if (!res.ok || !data.ok || !data.selected) {
            throw new Error(data.error ?? 'Could not get DHL rates')
          }
          setDhlQuote(data.selected)
          setDhlDeliveryDate(data.selected.deliveryDate)
          setDhlAddressWarning(
            data.address && data.address.valid === false
              ? data.address.message ||
                  'DHL could not fully validate this city. You can still check out.'
              : '',
          )
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) return
          setDhlQuote(null)
          setDhlDeliveryDate(undefined)
          setDhlError(
            error instanceof Error ? error.message : 'Could not get DHL rates',
          )
          setDhlAddressWarning('')
        })
        .finally(() => {
          if (!controller.signal.aborted) setDhlLoading(false)
        })
    }, 500)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [
    dhlConfigured,
    countryCode,
    city,
    postalCode,
    addressLine,
    itemCount,
    locationId,
    liveDhl,
  ])

  useEffect(() => {
    if (shopifyCheckoutEnabled) {
      setPaymentMethod('shopify')
      return
    }
    // Prefer Credit card (Stripe) first when enabled for this market.
    if (market.payments.stripe) {
      setPaymentMethod('stripe')
      return
    }
    setPaymentMethod(market.defaultPaymentMethod)
  }, [
    market.defaultPaymentMethod,
    market.payments.stripe,
    locationId,
    shopifyCheckoutEnabled,
  ])

  // Shopify mode: skip this page and go straight to hosted checkout.
  const shopifyRedirectStarted = useRef(false)
  const returnedFromCheckout = useRef(false)

  const resumeFromShopify = useCallback(() => {
    returnedFromCheckout.current = true
    shopifyRedirectStarted.current = false
    setIsSubmitting(false)
    router.replace('/cart')
  }, [router])
  usePageResume(resumeFromShopify)

  useEffect(() => {
    if (
      returnedFromCheckout.current ||
      !shopifyCheckoutEnabled ||
      shopifyStatusLoading ||
      !isHydrated ||
      items.length === 0 ||
      shopifyRedirectStarted.current
    ) {
      return
    }

    shopifyRedirectStarted.current = true
    setIsSubmitting(true)

    void (async () => {
      try {
        const checkoutUrl = await startShopifyCheckout({
          items,
          countryCode:
            countryCode.trim().toUpperCase() ||
            geoCountryCode ||
            shopifyCountryCodeFromLocation(locationId),
          locationId,
          promoCode: appliedPromoCode || undefined,
          smileRewardFreeShipping,
        })
        window.location.href = checkoutUrl
      } catch (error) {
        shopifyRedirectStarted.current = false
        setIsSubmitting(false)
        toast.error(
          error instanceof Error
            ? error.message
            : 'Could not start Shopify checkout',
        )
      }
    })()
  }, [
    shopifyCheckoutEnabled,
    shopifyStatusLoading,
    isHydrated,
    items,
    locationId,
    appliedPromoCode,
    smileRewardFreeShipping,
    countryCode,
    geoCountryCode,
  ])

  const baseTotals = useMemo(
    () =>
      calculateCheckoutTotals(items, {
        promoCode: appliedPromoCode,
        promotions: checkoutPromotions,
        smileRewardFreeShipping,
        shippingOverride:
          dhlQuote != null ? dhlQuote.totalPriceBase : undefined,
      }),
    [
      items,
      appliedPromoCode,
      checkoutPromotions,
      smileRewardFreeShipping,
      dhlQuote,
    ],
  )
  const totals = useMemo(
    () =>
      localizeCheckoutTotals(baseTotals, location.currencyCode, dhlQuote),
    [baseTotals, location.currencyCode, dhlQuote],
  )
  const dhlProductCode = dhlQuote?.productCode
  const dhlProductName = dhlQuote?.productName
  const dhlEtaLabel = formatDhlDeliveryDate(dhlDeliveryDate)

  useEffect(() => {
    if (!isHydrated || items.length === 0 || checkoutTracked.current) return
    checkoutTracked.current = true
    const visitorId = getOrCreateVisitorId()
    trackInitiateCheckout(
      items.map((item) => ({ id: item.id, quantity: item.quantity })),
      totals.total,
      location.currencyCode,
      visitorId ? getInitiateCheckoutEventId(visitorId) : undefined,
    )
    trackVisitorFunnelEvent('checkout')
  }, [isHydrated, items, totals.total, locationId, location.currencyCode])

  useEffect(() => {
    if (!isHydrated || items.length === 0) return

    saveCheckoutDraft({
      email,
      name,
      phone,
      shippingAddress,
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
    })
  }, [
    affiliateCode,
    appliedPromoCode,
    email,
    isHydrated,
    items,
    locationId,
    name,
    phone,
    shippingAddress,
    smileRewardFreeShipping,
  ])

  const checkoutPayload = {
    visitorId: getOrCreateVisitorId() || undefined,
    name: name.trim(),
    email: email.trim(),
    phone: phone.trim() || undefined,
    shippingAddress: shippingAddress.trim() || undefined,
    shipping:
      city.trim().length >= 2 &&
      (
        countryCode.trim() ||
        countryCodeFromLocation(locationId) ||
        ''
      ).length === 2
        ? {
            countryCode: (
              countryCode.trim() ||
              countryCodeFromLocation(locationId) ||
              ''
            ).toUpperCase(),
            city: city.trim(),
            postalCode: postalCode.trim() || undefined,
            addressLine1: addressLine.trim() || undefined,
            productCode: dhlProductCode === 'D' ? 'P' : dhlProductCode,
          }
        : undefined,
    locationId,
    currencyCode: location.currencyCode,
    items: items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      variantImage: item.variantImage,
      variantLabel: item.variantLabel,
    })),
    promoCode: appliedPromoCode || undefined,
    affiliateCode: affiliateCode || undefined,
    smileRewardFreeShipping: smileRewardFreeShipping || undefined,
    eventSourceUrl:
      typeof window !== 'undefined' ? window.location.href : undefined,
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (items.length === 0) {
      toast.error('Your cart is empty')
      router.push('/cart')
      return
    }

    if (paymentMethod === 'cod' || paymentMethod === 'stripe') {
      if (paymentMethod === 'cod' && !phone.trim()) {
        toast.error('Phone number is required for cash on delivery')
        return
      }
      if (!shippingAddress.trim()) {
        toast.error(
          paymentMethod === 'stripe'
            ? 'Delivery address is required'
            : 'Delivery address is required for cash on delivery',
        )
        return
      }
    }

    if (cartHasUnavailableItems && !shopifyCheckoutEnabled) {
      toast.error(
        'Some items are not available in this market. Remove them to continue.',
      )
      return
    }

    if (liveDhl && !shopifyCheckoutEnabled) {
      if (!dhlConfigured) {
        toast.error('DHL shipping is not available. Please try again later.')
        return
      }
      if (dhlQuote == null) {
        toast.error(
          dhlError || 'Enter your city so we can calculate DHL shipping.',
        )
        return
      }
    }

    if (
      !shopifyCheckoutEnabled &&
      paymentMethod !== 'shopify' &&
      !market.payments[paymentMethod]
    ) {
      toast.error('That payment method is not available in this market.')
      return
    }

    if (
      (paymentMethod === 'shopify' || shopifyCheckoutEnabled) &&
      !email.trim()
    ) {
      toast.error('Enter your email to continue to checkout')
      return
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
      if (paymentMethod === 'shopify' || shopifyCheckoutEnabled) {
        const response = await fetch('/api/shopify/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim() || undefined,
            countryCode:
              countryCode.trim().toUpperCase() ||
              geoCountryCode ||
              shopifyCountryCodeFromLocation(locationId),
            items: items.map((item) => ({
              id: item.id,
              quantity: item.quantity,
              variantImage: item.variantImage,
              variantLabel: item.variantLabel,
            })),
          }),
        })

        const data = (await response.json()) as {
          ok?: boolean
          checkoutUrl?: string
          error?: string
        }

        if (!response.ok || !data.checkoutUrl) {
          throw new Error(data.error ?? 'Could not start Shopify checkout')
        }

        // Hosted Shopify Checkout — Meta Purchase fires via Meta sales channel.
        window.location.href = data.checkoutUrl
        return
      }

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

      if (paymentMethod === 'stripe') {
        if (!stripeCardRef.current) {
          throw new Error('Card fields are still loading. Please try again.')
        }

        const intentResponse = await fetch('/api/stripe/payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(checkoutPayload),
        })

        const intentData = (await intentResponse.json()) as {
          clientSecret?: string
          paymentIntentId?: string
          error?: string
        }

        if (
          !intentResponse.ok ||
          !intentData.clientSecret ||
          !intentData.paymentIntentId
        ) {
          throw new Error(intentData.error ?? 'Could not start Stripe payment')
        }

        const { paymentIntentId } = await stripeCardRef.current.confirmPayment(
          intentData.clientSecret,
          {
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim() || undefined,
          },
        )

        const verifyResponse = await fetch('/api/stripe/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentIntentId,
            visitorId: checkoutPayload.visitorId,
            eventSourceUrl: checkoutPayload.eventSourceUrl,
          }),
        })

        const verifyData = (await verifyResponse.json()) as {
          ok?: boolean
          error?: string
          order?: {
            orderNumber: string
            total: number
            currency: string
          }
        }

        if (!verifyResponse.ok || !verifyData.ok || !verifyData.order) {
          throw new Error(verifyData.error ?? 'Could not confirm Stripe payment')
        }

        trackPurchase({
          value: verifyData.order.total,
          currency: verifyData.order.currency,
          orderId: verifyData.order.orderNumber,
          items: items.map((item) => ({
            id: item.id,
            quantity: item.quantity,
          })),
        })

        clearCart()
        router.push(
          `/checkout/success?method=stripe&order=${encodeURIComponent(verifyData.order.orderNumber)}&total=${verifyData.order.total}`,
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

  if (!isHydrated || shopifyStatusLoading || (shopifyCheckoutEnabled && isSubmitting)) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 bg-neutral-50 text-neutral-500">
        <Loader2 className="size-5 animate-spin" />
        {shopifyCheckoutEnabled
          ? 'Redirecting to Shopify Checkout…'
          : 'Loading checkout…'}
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
      <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
        <div className="mb-5 sm:mb-8">
          <p className="text-sm text-neutral-500">Secure checkout</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
            Checkout
          </h1>
          {affiliate && (
            <p className="mt-2 text-sm text-neutral-600">
              Referred by <span className="font-medium">{affiliate.name}</span>{' '}
              <span className="font-mono text-neutral-500">({affiliate.code})</span>
            </p>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2 lg:items-start lg:gap-12">
          <form
            onSubmit={handleSubmit}
            className="order-2 min-w-0 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-8 lg:order-1"
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
                  Street address
                  {paymentMethod === 'cod' || paymentMethod === 'stripe' ? (
                    <span className="text-[#E91E8C]"> *</span>
                  ) : null}
                </label>
                <input
                  id="checkout-address"
                  required={paymentMethod === 'cod' || paymentMethod === 'stripe'}
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  placeholder="House number and street"
                  className="mt-1.5 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="checkout-city" className="text-sm font-medium">
                    City
                    <span className="text-[#E91E8C]"> *</span>
                  </label>
                  <input
                    id="checkout-city"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder={
                      locationId === 'ghana'
                        ? 'Accra, Kumasi, Tema…'
                        : countryCode === 'NG'
                          ? 'Lagos, Abuja…'
                          : 'City'
                    }
                    className="mt-1.5 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950"
                  />
                </div>
                <div>
                  <label
                    htmlFor="checkout-postal"
                    className="text-sm font-medium"
                  >
                    {locationId === 'usa' ? 'ZIP code' : 'Postal code'}
                    {postalRequired ? (
                      <span className="text-[#E91E8C]"> *</span>
                    ) : null}
                  </label>
                  <input
                    id="checkout-postal"
                    required={postalRequired}
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder={
                      locationId === 'usa'
                        ? '10001'
                        : postalRequired
                          ? 'Required for DHL rates'
                          : 'Optional'
                    }
                    className="mt-1.5 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950"
                  />
                </div>
              </div>

              {locationId === 'international' ? (
                <div>
                  <label
                    htmlFor="checkout-country"
                    className="text-sm font-medium"
                  >
                    Country
                    <span className="text-[#E91E8C]"> *</span>
                  </label>
                  <select
                    id="checkout-country"
                    required
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950"
                  >
                    {internationalCountryOptions(
                      countryCode || geoCountryCode,
                    ).map((option) => (
                      <option key={option.code} value={option.code}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              {dhlConfigured && liveDhl ? (
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
                  {dhlLoading ? (
                    <p className="flex items-center gap-2">
                      <Loader2 className="size-3.5 animate-spin" />
                      Calculating DHL Express shipping…
                    </p>
                  ) : dhlQuote != null && dhlProductName ? (
                    <p>
                      DHL Express:{' '}
                      <span className="font-medium text-neutral-950">
                        {dhlProductName}
                      </span>
                      {dhlEtaLabel ? ` · arrives ${dhlEtaLabel}` : ''}
                      . Rate applied in your order summary.
                    </p>
                  ) : dhlError ? (
                    <p className="text-amber-800">{dhlError}</p>
                  ) : (
                    <p className="text-neutral-500">
                      Enter city
                      {postalRequired
                        ? locationId === 'usa'
                          ? ' and ZIP'
                          : ' and postal code'
                        : ''}{' '}
                      to get a live DHL rate.
                    </p>
                  )}
                  {dhlAddressWarning ? (
                    <p className="mt-2 text-xs text-amber-800">
                      {dhlAddressWarning}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            {cartHasUnavailableItems ? (
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                Some items in your cart are not available in this market. Remove
                them or switch region to continue.
              </div>
            ) : null}

            <div className="mt-8">
              <h2 className="text-lg font-semibold text-neutral-950">
                Payment
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                All transactions are secure and encrypted.
              </p>

              {shopifyCheckoutEnabled || shopifyStatusLoading ? (
                <button
                  type="button"
                  onClick={() => setPaymentMethod('shopify')}
                  className={cn(
                    'mt-4 w-full rounded-2xl border px-4 py-4 text-left transition-colors',
                    paymentMethod === 'shopify'
                      ? 'border-neutral-950 bg-neutral-50'
                      : 'border-neutral-200 hover:border-neutral-400',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Lock className="size-4" />
                    <span className="text-sm font-semibold">
                      Checkout securely
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">
                    Paystack, cash on delivery & more via Shopify Checkout
                  </p>
                </button>
              ) : (
                <div className="mt-4 overflow-hidden rounded-xl border border-neutral-300">
                  {market.payments.stripe ? (
                    <div
                      className={cn(
                        paymentMethod === 'stripe'
                          ? 'border-b border-neutral-300'
                          : market.payments.paystack || market.payments.cod
                            ? 'border-b border-neutral-200'
                            : '',
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('stripe')}
                        className="flex w-full flex-col gap-3 bg-white px-3.5 py-3.5 text-left sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-4"
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <span
                            className={cn(
                              'flex size-4 shrink-0 items-center justify-center rounded-full border',
                              paymentMethod === 'stripe'
                                ? 'border-neutral-950'
                                : 'border-neutral-400',
                            )}
                            aria-hidden
                          >
                            {paymentMethod === 'stripe' ? (
                              <span className="size-2 rounded-full bg-neutral-950" />
                            ) : null}
                          </span>
                          <span className="text-sm font-semibold text-neutral-950">
                            Credit card
                          </span>
                        </span>
                        <CardBrandBadges className="pl-7 sm:pl-0" />
                      </button>

                      {paymentMethod === 'stripe' ? (
                        <div className="border-b border-neutral-200 bg-white px-3 pb-4 pt-2 sm:px-4 sm:pt-3">
                          <StripeElementsProvider>
                            <StripeCardFields
                              ref={stripeCardRef}
                              disabled={isSubmitting}
                              defaultName={name}
                            />
                          </StripeElementsProvider>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {market.payments.paystack ? (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('paystack')}
                      className={cn(
                        'flex w-full flex-col gap-3 bg-white px-3.5 py-3.5 text-left sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-4',
                        market.payments.cod
                          ? 'border-b border-neutral-200'
                          : '',
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span
                          className={cn(
                            'flex size-4 shrink-0 items-center justify-center rounded-full border',
                            paymentMethod === 'paystack'
                              ? 'border-neutral-950'
                              : 'border-neutral-400',
                          )}
                          aria-hidden
                        >
                          {paymentMethod === 'paystack' ? (
                            <span className="size-2 rounded-full bg-neutral-950" />
                          ) : null}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-neutral-950">
                            Pay online with Paystack
                          </span>
                          <span className="mt-0.5 block text-xs leading-snug text-neutral-500">
                            <span className="sm:hidden">
                              Card &amp; mobile money
                            </span>
                            <span className="hidden sm:inline">
                              Card, MTN MoMo, Telecel, AirtelTigo &amp; bank
                            </span>
                          </span>
                        </span>
                      </span>
                      <PaystackPaymentBadges className="w-full justify-start pl-7 sm:w-auto sm:justify-end sm:pl-0" />
                    </button>
                  ) : null}

                  {market.payments.cod ? (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cod')}
                      className="flex w-full items-center gap-3 bg-white px-3.5 py-3.5 text-left sm:px-4"
                    >
                      <span
                        className={cn(
                          'flex size-4 items-center justify-center rounded-full border',
                          paymentMethod === 'cod'
                            ? 'border-neutral-950'
                            : 'border-neutral-400',
                        )}
                        aria-hidden
                      >
                        {paymentMethod === 'cod' ? (
                          <span className="size-2 rounded-full bg-neutral-950" />
                        ) : null}
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-neutral-950">
                          Cash on delivery
                        </span>
                        <span className="mt-0.5 block text-xs text-neutral-500">
                          Pay with cash when your order arrives
                        </span>
                      </span>
                    </button>
                  ) : null}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={
                isSubmitting ||
                cartHasUnavailableItems ||
                (liveDhl &&
                  !shopifyCheckoutEnabled &&
                  (dhlLoading || dhlQuote == null))
              }
              className="sticky bottom-3 z-20 mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-neutral-950 py-3.5 text-sm font-semibold text-white shadow-[0_8px_30px_rgba(0,0,0,0.18)] transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70 lg:static lg:shadow-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {paymentMethod === 'cod'
                    ? 'Placing order…'
                    : paymentMethod === 'shopify'
                      ? 'Redirecting to Shopify…'
                      : paymentMethod === 'stripe'
                        ? 'Processing card…'
                        : 'Redirecting to Paystack…'}
                </>
              ) : paymentMethod === 'cod' ? (
                <>
                  <Banknote className="size-4" />
                  Place order — cash on delivery
                </>
              ) : paymentMethod === 'shopify' ? (
                <>
                  <Lock className="size-4" />
                  Continue to Shopify Checkout
                </>
              ) : paymentMethod === 'stripe' ? (
                <>
                  <Lock className="size-4" />
                  Pay securely
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
              ) : paymentMethod === 'shopify' ? (
                <>
                  You&apos;ll choose Paystack, cash on delivery, or other
                  methods on Shopify Checkout ({location.label}).
                </>
              ) : paymentMethod === 'stripe' ? (
                <>
                  Enter your card details above. You&apos;ll be charged in{' '}
                  <span className="font-medium text-neutral-700">
                    {location.currencyCode}
                  </span>{' '}
                  ({location.label}).
                </>
              ) : (
                <>
                  You&apos;ll be charged in{' '}
                  <span className="font-medium text-neutral-700">
                    {toPaystackChargeCurrency(location.currencyCode)}
                  </span>{' '}
                  via Paystack ({location.label}).
                </>
              )}
            </p>
          </form>

          <div className="order-1 w-full min-w-0 lg:order-2 lg:min-w-[24rem]">
            <CheckoutOrderSummary
              items={items}
              totals={totals}
              totalsLocalized
              onQuantityChange={setQuantity}
              shippingPending={
                liveDhl &&
                !smileRewardFreeShipping &&
                dhlQuote == null &&
                !dhlLoading
              }
              shippingLoading={liveDhl && dhlLoading}
              shippingCarrier={
                liveDhl && dhlQuote != null
                  ? dhlProductName || 'DHL Express'
                  : undefined
              }
              shippingEta={dhlEtaLabel}
            />
          </div>
        </div>

        <div className="mt-6 pb-[max(1rem,env(safe-area-inset-bottom))] sm:mt-8 lg:mt-10">
          {market.payments.stripe && !market.payments.paystack ? null : (
            <CheckoutUpsells cartItems={items} />
          )}
        </div>
      </div>
    </div>
  )
}
