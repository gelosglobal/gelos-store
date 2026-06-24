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

export function trackMetaPageView() {
  trackMetaEvent('PageView')
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
  trackMetaEvent('InitiateCheckout', {
    content_ids: items.map((item) => item.id),
    content_type: 'product',
    contents: items.map((item) => ({
      id: item.id,
      quantity: item.quantity ?? 1,
    })),
    num_items: items.reduce((sum, item) => sum + (item.quantity ?? 1), 0),
    value,
    currency,
  })
}

export function trackPurchase(input: {
  value: number
  currency?: string
  orderId?: string
  items: MetaPixelLineItem[]
}) {
  trackMetaEvent('Purchase', {
    value: input.value,
    currency: input.currency ?? 'GHS',
    content_ids: input.items.map((item) => item.id),
    content_type: 'product',
    contents: input.items.map((item) => ({
      id: item.id,
      quantity: item.quantity ?? 1,
    })),
    num_items: input.items.reduce(
      (sum, item) => sum + (item.quantity ?? 1),
      0,
    ),
    ...(input.orderId ? { order_id: input.orderId } : {}),
  })
}
