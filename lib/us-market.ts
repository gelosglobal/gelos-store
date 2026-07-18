import {
  DEFAULT_ALL_MARKET_SETTINGS,
  isProductAvailableInMarket,
} from '@/lib/market-settings'

/** @deprecated Prefer market settings `restrictCatalog` / `productIds`. */
export const US_INHALER_PRODUCT_IDS = ['9', '5'] as const

export type UsInhalerProductId = (typeof US_INHALER_PRODUCT_IDS)[number]

export function isUsInhalerProductId(id: string): boolean {
  return isProductAvailableInMarket(id, DEFAULT_ALL_MARKET_SETTINGS.usa)
}

export function assertUsInhalerCartItems(items: { id: string }[]): void {
  if (items.length === 0) {
    throw new Error('Your cart is empty')
  }

  const invalid = items.filter((item) => !isUsInhalerProductId(item.id))
  if (invalid.length > 0) {
    throw new Error(
      'US checkout is for Gelos nasal inhalers only. Remove other products or switch region.',
    )
  }
}
