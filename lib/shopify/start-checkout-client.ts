type StartShopifyCheckoutInput = {
  items: Array<{
    id: string
    quantity: number
    variantImage?: string
    variantLabel?: string
  }>
  countryCode?: string
  email?: string
}

/**
 * Create a Shopify cart and return the hosted checkout URL.
 * Used for direct cart → Shopify Checkout (skips the Next.js /checkout page).
 */
export async function startShopifyCheckout(
  input: StartShopifyCheckoutInput,
): Promise<string> {
  if (input.items.length === 0) {
    throw new Error('Your cart is empty')
  }

  const response = await fetch('/api/shopify/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: input.email?.trim() || undefined,
      countryCode: input.countryCode,
      items: input.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        variantImage: item.variantImage,
        variantLabel: item.variantLabel,
      })),
    }),
  })

  const data = (await response.json()) as {
    ok?: boolean
    checkoutUrl?: string
    error?: string
  }

  if (!response.ok || !data.checkoutUrl) {
    throw new Error(data.error ?? 'Could not start Shopify checkout')
  }

  return data.checkoutUrl
}
