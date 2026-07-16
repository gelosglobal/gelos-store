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

/** Stripe expects amounts in the smallest currency unit (cents). */
export function toStripeAmount(amount: number): number {
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
          unit_amount: toStripeAmount(item.price),
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
        unit_amount: toStripeAmount(input.totals.shipping),
        product_data: {
          name: 'Shipping',
        },
      },
    })
  }

  let discounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined
  if (input.totals.discount > 0) {
    const coupon = await stripe.coupons.create({
      amount_off: toStripeAmount(input.totals.discount),
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
      location_id: 'usa',
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
