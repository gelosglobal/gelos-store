/** Cover art for whitening treatment picker on PDP */
export const whiteningTreatmentCoverByProductId: Record<string, string> = {
  '3': '/gelos/GELOS1967.jpg',
}

/** Whitening products with no cross-product treatment picker (standalone SKUs). */
export const whiteningStandaloneProductIds = ['7', '10'] as const

export const whiteningTreatmentOrder = ['3'] as const

export function isWhiteningStandaloneProduct(productId: string): boolean {
  return (whiteningStandaloneProductIds as readonly string[]).includes(productId)
}

export function getWhiteningLineVariants<
  T extends { id: string },
>(product: T, categoryVariants: T[]): T[] {
  if (isWhiteningStandaloneProduct(product.id)) {
    return [product]
  }

  const orderSet = new Set<string>(whiteningTreatmentOrder)
  const standalone = new Set<string>(whiteningStandaloneProductIds)

  return categoryVariants.filter(
    (item) => orderSet.has(item.id) && !standalone.has(item.id),
  )
}

export function getWhiteningTreatmentCover(
  productId: string,
  fallbackImage: string,
): string {
  return whiteningTreatmentCoverByProductId[productId] ?? fallbackImage
}

export function getWhiteningTreatmentLabel(name: string): string {
  return name
    .replace(/ \(30 pairs\)$/i, '')
    .replace(/^Premium /i, '')
    .replace(/^Activated /i, '')
    .trim()
}
