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
    ) => void
    _fbq?: unknown
  }
}

export function trackMetaEvent(
  event: string,
  params?: Record<string, unknown>,
) {
  if (typeof window === 'undefined' || !isMetaPixelEnabled()) return
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
}) {
  trackMetaEvent('ViewContent', {
    content_ids: [product.id],
    content_name: product.name,
    content_type: 'product',
    value: product.price,
    currency: 'GHS',
    content_category: product.category,
  })
}

export function trackAddToCart(product: {
  id: string
  name: string
  price: number
  quantity: number
}) {
  trackMetaEvent('AddToCart', {
    content_ids: [product.id],
    content_name: product.name,
    content_type: 'product',
    value: product.price * product.quantity,
    currency: 'GHS',
    contents: [{ id: product.id, quantity: product.quantity }],
    num_items: product.quantity,
  })
}

export function trackInitiateCheckout(
  items: MetaPixelLineItem[],
  value: number,
  currency = 'GHS',
) {
  trackMetaEvent('InitiateCheckout', cartEventPayload(items, value, currency))
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

export function trackSubscribe() {
  trackMetaEvent('Subscribe')
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
  trackMetaEvent('Purchase', {
    ...cartEventPayload(
      input.items,
      input.value,
      input.currency ?? 'GHS',
    ),
    ...(input.orderId ? { order_id: input.orderId } : {}),
  })
}
