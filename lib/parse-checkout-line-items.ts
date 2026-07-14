import type { CheckoutLineItem } from '@/lib/checkout'

function asOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed || undefined
}

function asRequiredString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return null
}

function asPositiveNumber(value: unknown): number | null {
  const num = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(num) || num < 0) return null
  return num
}

/**
 * Parses checkout line items from Paystack metadata / stored JSON.
 * Coerces stringified numbers (common from Paystack) so paid orders keep
 * their purchased items instead of showing 0 items.
 */
export function parseCheckoutLineItems(raw: unknown): CheckoutLineItem[] {
  if (!Array.isArray(raw)) return []

  return raw
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null
      const record = entry as Record<string, unknown>

      const id = asRequiredString(record.id)
      const name = asRequiredString(record.name)
      const price = asPositiveNumber(record.price)
      const quantity = asPositiveNumber(record.quantity)

      if (!id || !name || price === null || quantity === null || quantity < 1) {
        return null
      }

      return {
        id,
        name,
        productName: asOptionalString(record.productName),
        price,
        quantity: Math.floor(quantity),
        variantLabel: asOptionalString(record.variantLabel),
        variantImage: asOptionalString(record.variantImage),
      } satisfies CheckoutLineItem
    })
    .filter((item): item is CheckoutLineItem => item !== null)
}
