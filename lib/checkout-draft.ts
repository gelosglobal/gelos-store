import { getOrCreateVisitorId } from '@/lib/visitor-id'

export type CheckoutDraftPayload = {
  email?: string
  name?: string
  phone?: string
  shippingAddress?: string
  locationId: string
  items: {
    id: string
    quantity: number
    variantImage?: string
    variantLabel?: string
  }[]
  promoCode?: string
  affiliateCode?: string
  smileRewardFreeShipping?: boolean
}

let draftTimer: ReturnType<typeof setTimeout> | null = null
let lastPayloadKey = ''

/** Debounced save of checkout progress for abandoned-cart recovery. */
export function saveCheckoutDraft(payload: CheckoutDraftPayload, delayMs = 1500) {
  if (typeof window === 'undefined') return

  const visitorId = getOrCreateVisitorId()
  if (!visitorId || payload.items.length === 0) return

  const payloadKey = JSON.stringify({ visitorId, ...payload })
  if (payloadKey === lastPayloadKey) return
  lastPayloadKey = payloadKey

  if (draftTimer) window.clearTimeout(draftTimer)

  draftTimer = window.setTimeout(() => {
    void fetch('/api/checkout/draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorId,
        ...payload,
      }),
      keepalive: true,
    }).catch(() => undefined)
  }, delayMs)
}
