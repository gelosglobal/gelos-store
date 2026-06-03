/** Cover art for wellness flavour picker on PDP */
export const wellnessFlavorCoverByProductId: Record<string, string> = {
  '9': '/gelos/grape-mint-fruit-energy.png',
  '5': '/gelos/mango-inhaler.png',
}

export const wellnessFlavorOrder = ['9', '5'] as const

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
