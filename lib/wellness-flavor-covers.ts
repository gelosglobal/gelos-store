/** Cover art for wellness flavour picker on PDP */
export const wellnessFlavorCoverByProductId: Record<string, string> = {
  '9': '/gelos/grape-mint-fruit-energy.png',
  '5': '/gelos/mango-inhaler.png',
}

export const wellnessFlavorOrder = ['9', '5'] as const

/** Wellness SKUs with no cross-product flavour picker (serums, oils, etc.). */
export const wellnessStandaloneProductIds = ['28', '29', '31'] as const

export function isWellnessStandaloneProduct(productId: string): boolean {
  return (wellnessStandaloneProductIds as readonly string[]).includes(productId)
}

export function getWellnessLineVariants<T extends { id: string }>(
  product: T,
  categoryVariants: T[],
): T[] {
  if (isWellnessStandaloneProduct(product.id)) {
    return [product]
  }

  const orderSet = new Set<string>(wellnessFlavorOrder)
  const standalone = new Set<string>(wellnessStandaloneProductIds)

  return categoryVariants.filter(
    (item) => orderSet.has(item.id) && !standalone.has(item.id),
  )
}

export function getWellnessFlavorCover(
  productId: string,
  fallbackImage: string,
): string {
  return wellnessFlavorCoverByProductId[productId] ?? fallbackImage
}

export function getWellnessFlavorLabel(name: string): string {
  return name
    .replace(/ Fruit Energy$/i, '')
    .replace(/ Nasal Inhaler$/i, '')
    .replace(/^Aromatherapy /i, '')
    .trim()
}
