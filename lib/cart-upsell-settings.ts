export type CartUpsellSettings = {
  enabled: boolean
  /** Products that trigger qty 2 / qty 3 upsells. Empty = use categories. */
  quantityProductIds: string[]
  /** Fallback categories when quantityProductIds is empty. */
  quantityCategories: string[]
  /** Cross-sell products in priority order. Empty = auto complementary picks. */
  crossSellProductIds: string[]
  tier2DiscountPercent: number
  tier3DiscountPercent: number
  crossSellDiscountPercent: number
  tier2Badge: string
  tier3Badge: string
  crossSellBadge: string
  crossSellUrgency: string
}

export const DEFAULT_CART_UPSELL_SETTINGS: CartUpsellSettings = {
  enabled: true,
  quantityProductIds: [],
  quantityCategories: ['Toothpaste', 'Mouthwash', 'Toothbrushes'],
  crossSellProductIds: [],
  tier2DiscountPercent: 12,
  tier3DiscountPercent: 18,
  crossSellDiscountPercent: 15,
  tier2Badge: 'Bundle and Save',
  tier3Badge: 'Stock Up & Save',
  crossSellBadge: 'HOT PRICE OFFER 🔥',
  crossSellUrgency: 'Insane offer won\u2019t last long',
}

function uniqueProductIds(ids: unknown): string[] {
  if (!Array.isArray(ids)) return []
  const seen = new Set<string>()
  const result: string[] = []
  for (const id of ids) {
    if (typeof id !== 'string') continue
    const trimmed = id.trim()
    if (!trimmed || seen.has(trimmed)) continue
    seen.add(trimmed)
    result.push(trimmed)
  }
  return result
}

function clampPercent(value: unknown, fallback: number): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(100, Math.max(0, parsed))
}

function cleanText(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback
  const trimmed = value.trim()
  return trimmed || fallback
}

function cleanCategories(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback
  const categories = value
    .filter((category): category is string => typeof category === 'string')
    .map((category) => category.trim())
    .filter(Boolean)
  return categories.length > 0 ? categories : fallback
}

export function sanitizeCartUpsellSettings(
  input: Partial<CartUpsellSettings> | null | undefined,
): CartUpsellSettings {
  const defaults = DEFAULT_CART_UPSELL_SETTINGS
  if (!input || typeof input !== 'object') return defaults

  return {
    enabled: input.enabled ?? defaults.enabled,
    quantityProductIds: uniqueProductIds(input.quantityProductIds),
    quantityCategories: cleanCategories(
      input.quantityCategories,
      defaults.quantityCategories,
    ),
    crossSellProductIds: uniqueProductIds(input.crossSellProductIds),
    tier2DiscountPercent: clampPercent(
      input.tier2DiscountPercent,
      defaults.tier2DiscountPercent,
    ),
    tier3DiscountPercent: clampPercent(
      input.tier3DiscountPercent,
      defaults.tier3DiscountPercent,
    ),
    crossSellDiscountPercent: clampPercent(
      input.crossSellDiscountPercent,
      defaults.crossSellDiscountPercent,
    ),
    tier2Badge: cleanText(input.tier2Badge, defaults.tier2Badge),
    tier3Badge: cleanText(input.tier3Badge, defaults.tier3Badge),
    crossSellBadge: cleanText(input.crossSellBadge, defaults.crossSellBadge),
    crossSellUrgency: cleanText(input.crossSellUrgency, defaults.crossSellUrgency),
  }
}
