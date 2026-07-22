/** Stable event_id shared by browser pixel + CAPI InitiateCheckout (dedupe). */
export function getInitiateCheckoutEventId(visitorId: string): string {
  const day = new Date().toISOString().slice(0, 10)
  return `checkout_${visitorId}_${day}`
}
