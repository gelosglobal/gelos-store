import { getOrCreateVisitorId } from '@/lib/visitor-id'

export type VisitorFunnelEventName = 'add_to_cart' | 'checkout' | 'purchase'

/** Fire-and-forget first-party funnel event for live analytics. */
export function trackVisitorFunnelEvent(event: VisitorFunnelEventName) {
  if (typeof window === 'undefined') return

  const visitorId = getOrCreateVisitorId()
  if (!visitorId) return

  void fetch('/api/visitors/funnel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ visitorId, event }),
    keepalive: true,
  }).catch(() => undefined)
}
