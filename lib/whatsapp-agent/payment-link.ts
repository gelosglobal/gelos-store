import {
  createPendingPaystackOrder,
} from '@/lib/db/orders'
import {
  initializeTransaction,
  isPaystackConfigured,
} from '@/lib/paystack'
import type { CheckoutLineItem } from '@/lib/checkout'
import type { WaOrderRecord } from '@/lib/whatsapp-agent/types'
import * as store from '@/lib/whatsapp-agent/store'

const PAYSTACK_METHODS = new Set(['mobile_money', 'card'])

export function paymentMethodNeedsPaystackLink(method: string) {
  return PAYSTACK_METHODS.has(String(method || '').trim())
}

function appOrigin() {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (configured) return configured.replace(/\/$/, '')
  return 'https://www.gelosglobal.com'
}

function syntheticEmail(whatsappId: string) {
  const digits = String(whatsappId || '').replace(/\D/g, '') || 'unknown'
  return `wa.${digits}@customers.gelosglobal.com`
}

function shippingAddress(order: WaOrderRecord) {
  return [order.delivery_area, order.landmark, order.location_url]
    .filter(Boolean)
    .join(' · ')
}

function toCheckoutItems(order: WaOrderRecord): CheckoutLineItem[] {
  return (order.items || []).map((item) => ({
    id: item.product_id,
    name: item.variant
      ? `${item.product_name} (${item.variant})`
      : item.product_name,
    productName: item.product_name,
    price: item.unit_price_ghs,
    quantity: item.quantity,
    variantLabel: item.variant || undefined,
  }))
}

export type WhatsappPaymentLinkResult =
  | {
      ok: true
      provider: 'paystack'
      authorizationUrl: string
      reference: string
      reused: boolean
    }
  | {
      ok: false
      skipped: true
      reason: string
    }
  | {
      ok: false
      skipped: false
      reason: string
    }

/**
 * Create (or reuse) a Paystack checkout link for Mobile Money / Card WhatsApp orders.
 */
export async function ensureWhatsappPaystackLink(
  order: WaOrderRecord,
): Promise<WhatsappPaymentLinkResult> {
  if (!paymentMethodNeedsPaystackLink(order.payment_method)) {
    return {
      ok: false,
      skipped: true,
      reason:
        order.payment_method === 'cash_on_delivery'
          ? 'Cash on delivery — no payment link needed.'
          : `Payment method "${order.payment_method}" does not use an automatic Paystack link.`,
    }
  }

  if (order.payment_link && order.payment_reference) {
    return {
      ok: true,
      provider: 'paystack',
      authorizationUrl: order.payment_link,
      reference: order.payment_reference,
      reused: true,
    }
  }

  if (!isPaystackConfigured()) {
    return {
      ok: false,
      skipped: false,
      reason: 'Paystack is not configured on the server.',
    }
  }

  if (!(order.total_ghs > 0)) {
    return {
      ok: false,
      skipped: false,
      reason: 'Order total must be greater than zero.',
    }
  }

  const items = toCheckoutItems(order)
  const email = syntheticEmail(order.whatsapp_id)
  const callbackUrl = `${appOrigin()}/checkout/callback`
  const payment = await initializeTransaction({
    email,
    name: order.customer_name,
    phone: order.alternate_phone || order.whatsapp_id,
    shippingAddress: shippingAddress(order),
    locationId: 'ghana',
    items,
    totals: {
      subtotal: order.subtotal_ghs,
      discount: 0,
      shipping: order.delivery_fee_ghs,
      total: order.total_ghs,
    },
    callbackUrl,
  })

  try {
    await createPendingPaystackOrder({
      orderNumber: order.order_id,
      paystackReference: payment.reference,
      customerName: order.customer_name,
      customerEmail: email,
      customerPhone: order.alternate_phone || order.whatsapp_id,
      shippingAddress: shippingAddress(order),
      items,
      subtotal: order.subtotal_ghs,
      shipping: order.delivery_fee_ghs,
      discount: 0,
      total: order.total_ghs,
      currency: 'GHS',
      locationId: 'ghana',
      channel: 'WhatsApp',
    })
  } catch (error) {
    console.error('[whatsapp-agent] pending_paystack_order_failed', error)
  }

  const updated = await store.attachOrderPaymentLink(order.order_id, {
    paymentLink: payment.authorizationUrl,
    paymentReference: payment.reference,
  })

  return {
    ok: true,
    provider: 'paystack',
    authorizationUrl: payment.authorizationUrl,
    reference: payment.reference,
    reused: false,
    ...(updated ? {} : {}),
  }
}

export function formatPaymentLinkMessage(
  order: WaOrderRecord,
  link: string,
) {
  const methodLabel =
    order.payment_method === 'mobile_money'
      ? 'Mobile Money'
      : order.payment_method === 'card'
        ? 'Card'
        : 'online'
  return [
    `Please pay *GHS ${order.total_ghs.toFixed(2)}* for order *${order.order_id}* via secure ${methodLabel} checkout:`,
    link,
    '',
    'Never share your PIN or OTP in this chat. After paying, reply here and we will confirm.',
  ].join('\n')
}
