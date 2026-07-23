export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim()

export type MetaPixelLineItem = {
  id: string
  quantity?: number
}

export function isMetaPixelEnabled(): boolean {
  return Boolean(META_PIXEL_ID)
}

declare global {
  interface Window {
    fbq?: (
      command: string,
      eventOrPixelId: string,
      params?: Record<string, unknown>,
      options?: { eventID?: string },
    ) => void
    _fbq?: unknown
  }
}

export function trackMetaEvent(
  event: string,
  params?: Record<string, unknown>,
  options?: { eventID?: string },
) {
  if (typeof window === 'undefined' || !isMetaPixelEnabled()) return
  if (options?.eventID) {
    window.fbq?.('track', event, params, options)
    return
  }
  window.fbq?.('track', event, params)
}

export function trackMetaCustomEvent(
  event: string,
  params?: Record<string, unknown>,
) {
  if (typeof window === 'undefined' || !isMetaPixelEnabled()) return
  window.fbq?.('trackCustom', event, params)
}

export function trackMetaPageView() {
  trackMetaEvent('PageView')
}

function cartEventPayload(
  items: MetaPixelLineItem[],
  value: number,
  currency = 'GHS',
) {
  return {
    content_ids: items.map((item) => item.id),
    content_type: 'product',
    contents: items.map((item) => ({
      id: item.id,
      quantity: item.quantity ?? 1,
    })),
    num_items: items.reduce((sum, item) => sum + (item.quantity ?? 1), 0),
    value,
    currency,
  }
}

export function trackViewContent(product: {
  id: string
  name: string
  price: number
  category?: string
  currency?: string
}) {
  trackMetaEvent('ViewContent', {
    content_ids: [product.id],
    content_name: product.name,
    content_type: 'product',
    value: product.price,
    currency: normalizeMetaCurrency(product.currency),
    content_category: product.category,
  })
}

export function trackAddToCart(product: {
  id: string
  name: string
  price: number
  quantity: number
  currency?: string
}) {
  trackMetaEvent('AddToCart', {
    content_ids: [product.id],
    content_name: product.name,
    content_type: 'product',
    value: product.price * product.quantity,
    currency: normalizeMetaCurrency(product.currency),
    contents: [{ id: product.id, quantity: product.quantity }],
    num_items: product.quantity,
  })
}

export function trackInitiateCheckout(
  items: MetaPixelLineItem[],
  value: number,
  currency = 'GHS',
  eventId?: string,
) {
  trackMetaEvent(
    'InitiateCheckout',
    cartEventPayload(items, value, currency),
    eventId ? { eventID: eventId } : undefined,
  )
}

export function trackViewCart(
  items: MetaPixelLineItem[],
  value: number,
  currency = 'GHS',
) {
  trackMetaCustomEvent('ViewCart', cartEventPayload(items, value, currency))
}

export function trackViewCategory(input: {
  category: string
  contentIds: string[]
}) {
  trackMetaCustomEvent('ViewCategory', {
    content_category: input.category,
    content_ids: input.contentIds,
    content_type: 'product',
    num_items: input.contentIds.length,
  })
}

export function trackSearch(searchString: string) {
  trackMetaEvent('Search', {
    search_string: searchString,
  })
}

export function trackContact() {
  trackMetaEvent('Contact')
}

export function trackLead(contentName?: string) {
  trackMetaEvent('Lead', {
    ...(contentName ? { content_name: contentName } : {}),
  })
}

export function trackSubscribe(input?: {
  /** Estimated conversion value for this subscribe (must be > 0). */
  value?: number
  /** ISO 4217 currency code, e.g. GHS / USD / NGN. */
  currency?: string
  /** Predicted lifetime value of the subscriber. */
  predictedLtv?: number
}) {
  // Meta flags Subscribe when value/currency are missing or malformed (ROAS).
  const currency = normalizeMetaCurrency(input?.currency)
  const value = normalizeMetaMoney(input?.value, 5)
  const predictedLtv = normalizeMetaMoney(
    input?.predictedLtv ?? input?.value,
    value,
  )

  trackMetaEvent('Subscribe', {
    value,
    currency,
    predicted_ltv: predictedLtv,
  })
}

function normalizeMetaCurrency(currency?: string): string {
  const code = currency?.trim().toUpperCase()
  if (code && /^[A-Z]{3}$/.test(code)) return code
  return 'GHS'
}

/** Meta expects a plain number >= 0 (no symbols/commas). Use > 0 for Subscribe. */
function normalizeMetaMoney(value: number | undefined, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.round(value * 100) / 100
  }
  return fallback
}

export function trackSchedule(contentName?: string) {
  trackMetaEvent('Schedule', {
    ...(contentName ? { content_name: contentName } : {}),
  })
}

export function trackCompleteRegistration(contentName?: string) {
  trackMetaEvent('CompleteRegistration', {
    ...(contentName ? { content_name: contentName } : {}),
  })
}

export function trackAddPaymentInfo(
  items: MetaPixelLineItem[],
  value: number,
  currency = 'GHS',
  paymentMethod?: string,
) {
  trackMetaEvent('AddPaymentInfo', {
    ...cartEventPayload(items, value, currency),
    ...(paymentMethod ? { payment_method: paymentMethod } : {}),
  })
}

export function trackPurchase(input: {
  value: number
  currency?: string
  orderId?: string
  items: MetaPixelLineItem[]
}) {
  // eventID matches the server Conversions API event so Meta deduplicates.
  trackMetaEvent(
    'Purchase',
    {
      ...cartEventPayload(
        input.items,
        input.value,
        input.currency ?? 'GHS',
      ),
      ...(input.orderId ? { order_id: input.orderId } : {}),
    },
    input.orderId ? { eventID: input.orderId } : undefined,
  )
}
