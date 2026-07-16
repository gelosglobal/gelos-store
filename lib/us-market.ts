/** US market sells nasal inhalers only (Wellness flavour line). */
export const US_INHALER_PRODUCT_IDS = ['9', '5'] as const

export type UsInhalerProductId = (typeof US_INHALER_PRODUCT_IDS)[number]

export function isUsInhalerProductId(id: string): boolean {
  return (US_INHALER_PRODUCT_IDS as readonly string[]).includes(id)
}

export function assertUsInhalerCartItems(
  items: { id: string }[],
): void {
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
