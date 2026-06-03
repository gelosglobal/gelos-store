/** Cover art for tongue scraper style picker on PDP */
export const tongueScraperStyleCoverByProductId: Record<string, string> = {
  '2': '/gelos/IMG_8035.JPG',
  '23': '/gelos/IMG_8030.JPG',
}

export const tongueScraperStyleOrder = ['2', '23'] as const

export function getTongueScraperStyleCover(
  productId: string,
  fallbackImage: string,
): string {
  return tongueScraperStyleCoverByProductId[productId] ?? fallbackImage
}

export function getTongueScraperStyleLabel(name: string): string {
  return name.replace(/ Tongue Scraper$/i, '').trim()
}
