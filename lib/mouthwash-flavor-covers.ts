/** Promotional cover art for mouthwash flavour picker on PDP */
export const mouthwashFlavorCoverByProductId: Record<string, string> = {
  '12': '/gelos/mouthwash-cover-watermelon.png',
  '20': '/gelos/mouthwash-cover-strawberry.png',
  '21': '/gelos/mouthwash-cover-blue-raspberry.png',
  '22': '/gelos/mouthwash-cover-grape-bubblegum.png',
}

export const mouthwashFlavorOrder = ['12', '20', '21', '22'] as const

export function getMouthwashFlavorCover(
  productId: string,
  fallbackImage: string,
): string {
  return mouthwashFlavorCoverByProductId[productId] ?? fallbackImage
}
