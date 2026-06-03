/** Cover art for toothbrush style picker on PDP */
export const toothbrushStyleCoverByProductId: Record<string, string> = {
  '8': '/gelos/bb.brushbl.png',
  '24': '/gelos/3d-sonicwave-g1-electric-toothbrush.png',
}

export const toothbrushStyleOrder = ['24', '8'] as const

export function getToothbrushStyleCover(
  productId: string,
  fallbackImage: string,
): string {
  const cover = toothbrushStyleCoverByProductId[productId]
  if (cover) return cover
  return fallbackImage.startsWith('/')
    ? fallbackImage
    : `/${fallbackImage.replace(/^\/+/, '')}`
}

export function getToothbrushStyleLabel(name: string): string {
  return name
    .replace(/ \(3-pack\)$/i, '')
    .replace(/ Set$/i, '')
    .trim()
}
