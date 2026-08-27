import Stripe from 'stripe'
import type { CheckoutLineItem } from '@/lib/checkout'

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim())
}

function getSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY?.trim()
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  return key
}

let stripeClient: Stripe | null = null

export function getStripe(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(getSecretKey())
  }
  return stripeClient
}

const ZERO_DECIMAL_CURRENCIES = new Set([
  'BIF',
  'CLP',
  'DJF',
  'GNF',
  'JPY',
  'KMF',
  'KRW',
  'MGA',
  'PYG',
  'RWF',
  'UGX',
  'VND',
  'VUV',
  'XAF',
  'XOF',
  'XPF',
])

const THREE_DECIMAL_CURRENCIES = new Set(['BHD', 'JOD', 'KWD', 'OMR', 'TND'])

/** Stripe expects amounts in the smallest currency unit. */
export function toStripeAmount(amount: number, currency = 'usd'): number {
  const code = currency.trim().toUpperCase()
  if (ZERO_DECIMAL_CURRENCIES.has(code)) return Math.round(amount)
  if (THREE_DECIMAL_CURRENCIES.has(code)) return Math.round(amount * 1000)
  return Math.round(amount * 100)
}

export type CreateStripeCheckoutInput = {
  email: string
  name: string
  phone?: string
  shippingAddress?: string
  items: CheckoutLineItem[]
  totals: {
    subtotal: number
    discount: number
    shipping: number
    total: number
  }
  currency: string
  promoCode?: string
  affiliateCode?: string
  affiliateId?: string
  commissionAmount?: number
  locationId?: string
  successUrl: string
  cancelUrl: string
}

export type CreateStripeCheckoutResult = {
  sessionId: string
  url: string
}

export async function createStripeCheckoutSession(
  input: CreateStripeCheckoutInput,
): Promise<CreateStripeCheckoutResult> {
  const stripe = getStripe()
  const currency = input.currency.toLowerCase()

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
    input.items.map((item) => {
      const image =
        item.variantImage?.startsWith('https://') ? item.variantImage : undefined
      return {
        quantity: item.quantity,
        price_data: {
          currency,
          unit_amount: toStripeAmount(item.price, currency),
          product_data: {
            name: item.name,
            ...(image ? { images: [image] } : {}),
          },
        },
      }
    })

  if (input.totals.shipping > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency,
        unit_amount: toStripeAmount(input.totals.shipping, currency),
        product_data: {
          name: 'Shipping',
        },
      },
    })
  }

  let discounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined
  if (input.totals.discount > 0) {
    const coupon = await stripe.coupons.create({
      amount_off: toStripeAmount(input.totals.discount, currency),
      currency,
      duration: 'once',
      name: input.promoCode?.trim() || 'Promo discount',
    })
    discounts = [{ coupon: coupon.id }]
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: input.email,
    line_items: lineItems,
    discounts,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    metadata: {
      customer_name: input.name,
      customer_email: input.email,
      customer_phone: input.phone ?? '',
      shipping_address: input.shippingAddress ?? '',
      location_id: input.locationId ?? 'usa',
      promo_code: input.promoCode ?? '',
      affiliate_code: input.affiliateCode ?? '',
      affiliate_id: input.affiliateId ?? '',
      commission_amount: String(input.commissionAmount ?? 0),
      subtotal: String(input.totals.subtotal),
      discount: String(input.totals.discount),
      shipping: String(input.totals.shipping),
      total: String(input.totals.total),
      currency: input.currency,
    },
  })

  if (!session.url) {
    throw new Error('Stripe did not return a checkout URL')
  }

  return {
    sessionId: session.id,
    url: session.url,
  }
}

export async function retrieveStripeCheckoutSession(sessionId: string) {
  return getStripe().checkout.sessions.retrieve(sessionId)
}

export type CreateStripePaymentIntentInput = {
  email: string
  name: string
  phone?: string
  shippingAddress?: string
  locationId: string
  totals: {
    subtotal: number
    discount: number
    shipping: number
    total: number
  }
  currency: string
  promoCode?: string
  affiliateCode?: string
  affiliateId?: string
  commissionAmount?: number
}

export async function createStripePaymentIntent(
  input: CreateStripePaymentIntentInput,
): Promise<{ paymentIntentId: string; clientSecret: string }> {
  const stripe = getStripe()
  const currency = input.currency.toLowerCase()

  const intent = await stripe.paymentIntents.create({
    amount: toStripeAmount(input.totals.total, currency),
    currency,
    payment_method_types: ['card'],
    receipt_email: input.email,
    description: `Gelos order — ${input.name}`,
    metadata: {
      customer_name: input.name,
      customer_email: input.email,
      customer_phone: input.phone ?? '',
      shipping_address: input.shippingAddress ?? '',
      location_id: input.locationId,
      promo_code: input.promoCode ?? '',
      affiliate_code: input.affiliateCode ?? '',
      affiliate_id: input.affiliateId ?? '',
      commission_amount: String(input.commissionAmount ?? 0),
      subtotal: String(input.totals.subtotal),
      discount: String(input.totals.discount),
      shipping: String(input.totals.shipping),
      total: String(input.totals.total),
      currency: input.currency,
    },
  })

  if (!intent.client_secret) {
    throw new Error('Stripe did not return a client secret')
  }

  return {
    paymentIntentId: intent.id,
    clientSecret: intent.client_secret,
  }
}

export async function retrieveStripePaymentIntent(paymentIntentId: string) {
  return getStripe().paymentIntents.retrieve(paymentIntentId)
}
