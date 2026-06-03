/** Cover art for whitening treatment picker on PDP */
export const whiteningTreatmentCoverByProductId: Record<string, string> = {
  '3': '/gelos/GELOS1967.jpg',
  '10': '/gelos/led-whitening-device.png',
  '7': '/gelos/strips.png',
  '4': '/gelos/GELOS2052.jpg',
}

export const whiteningTreatmentOrder = ['3', '10', '7', '4'] as const

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
