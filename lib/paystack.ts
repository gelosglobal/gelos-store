import { type CheckoutLineItem } from '@/lib/checkout'
import { getPaystackCurrencyForLocation } from '@/lib/exchange-rates'
import type { LocationId } from '@/lib/locations'

const PAYSTACK_BASE_URL = 'https://api.paystack.co'

export function isPaystackConfigured(): boolean {
  return Boolean(process.env.PAYSTACK_SECRET_KEY?.trim())
}

function getSecretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY?.trim()
  if (!key) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured')
  }
  return key
}

/** Paystack expects amounts in the smallest currency unit (pesewas, kobo, cents). */
export function toPaystackAmount(amount: number): number {
  return Math.round(amount * 100)
}

export function createPaystackReference(): string {
  const suffix = Math.random().toString(36).slice(2, 10)
  return `gelos_${Date.now()}_${suffix}`
}

type PaystackResponse<T> = {
  status: boolean
  message: string
  data: T
}

export async function paystackFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<PaystackResponse<T>> {
  const response = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  const payload = (await response.json()) as PaystackResponse<T>

  if (!response.ok || !payload.status) {
    throw new Error(payload.message || 'Paystack request failed')
  }

  return payload
}

export type InitializeTransactionInput = {
  email: string
  name: string
  phone?: string
  shippingAddress?: string
  locationId: LocationId
  items: CheckoutLineItem[]
  totals: {
    subtotal: number
    discount: number
    shipping: number
    total: number
  }
  promoApplied?: boolean
  promoCode?: string
  affiliateCode?: string
  affiliateId?: string
  commissionAmount?: number
  callbackUrl: string
}

export type InitializeTransactionResult = {
  authorizationUrl: string
  reference: string
  accessCode: string
}

export async function initializeTransaction(
  input: InitializeTransactionInput,
): Promise<InitializeTransactionResult> {
  const currency = getPaystackCurrencyForLocation(input.locationId)
  const reference = createPaystackReference()

  const payload = await paystackFetch<{
    authorization_url: string
    access_code: string
    reference: string
  }>('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify({
      email: input.email,
      amount: toPaystackAmount(input.totals.total),
      currency,
      reference,
      callback_url: input.callbackUrl,
      metadata: {
        customer_name: input.name,
        customer_email: input.email,
        customer_phone: input.phone ?? '',
        shipping_address: input.shippingAddress ?? '',
        location_id: input.locationId,
        charge_currency: currency,
        promo_applied: Boolean(input.promoApplied),
        promo_code: input.promoCode ?? '',
        affiliate_code: input.affiliateCode ?? '',
        affiliate_id: input.affiliateId ?? '',
        commission_amount: input.commissionAmount ?? 0,
        subtotal: input.totals.subtotal,
        discount: input.totals.discount,
        shipping: input.totals.shipping,
        total: input.totals.total,
        items: input.items.map((item) => ({
          id: item.id,
          name: item.name,
          productName: item.productName,
          price: item.price,
          quantity: item.quantity,
          variantLabel: item.variantLabel,
          // Omit long image URLs from Paystack metadata — items are stored in DB at initialize.
        })),
      },
    }),
  })

  return {
    authorizationUrl: payload.data.authorization_url,
    reference: payload.data.reference,
    accessCode: payload.data.access_code,
  }
}

export type VerifyTransactionResult = {
  reference: string
  amount: number
  currency: string
  paidAt: string | null
  channel: string | null
  metadata: Record<string, unknown>
}

export async function verifyTransaction(
  reference: string,
): Promise<VerifyTransactionResult> {
  const payload = await paystackFetch<{
    reference: string
    amount: number
    currency: string
    paid_at: string | null
    channel: string | null
    metadata: Record<string, unknown>
    status: string
  }>(`/transaction/verify/${encodeURIComponent(reference)}`)

  if (payload.data.status !== 'success') {
    throw new Error('Payment was not successful')
  }

  return {
    reference: payload.data.reference,
    amount: payload.data.amount,
    currency: payload.data.currency,
    paidAt: payload.data.paid_at,
    channel: payload.data.channel,
    metadata: payload.data.metadata ?? {},
  }
}
