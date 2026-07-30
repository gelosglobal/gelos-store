import { lookupByProductLineKey } from '@/lib/product-line-keys'
import type { Product } from '@/lib/types/product'

/** Cover art for tongue scraper style picker on PDP. */
export const tongueScraperStyleCoverByKey: Record<string, string> = {
  'stainless-steel-tongue-scraper': '/gelos/IMG_8035.JPG',
  'tongue-scraper': '/gelos/IMG_8035.JPG',
  'tongue-scraper-2': '/gelos/IMG_8035.JPG',
  '3-in-1-tongue-scraper': '/gelos/IMG_8035.JPG',
  '2': '/gelos/IMG_8035.JPG',

  'copper-tongue-scraper': '/gelos/IMG_8030.JPG',
  'tongue-scraper-1': '/gelos/IMG_8030.JPG',
  '23': '/gelos/IMG_8030.JPG',
}

export const tongueScraperStyleOrder = [
  'stainless-steel-tongue-scraper',
  'tongue-scraper',
  'tongue-scraper-2',
  '3-in-1-tongue-scraper',
  'copper-tongue-scraper',
  'tongue-scraper-1',
  '2',
  '23',
] as const

/** @deprecated Use tongueScraperStyleCoverByKey */
export const tongueScraperStyleCoverByProductId = tongueScraperStyleCoverByKey

export function getTongueScraperStyleCover(
  product: Pick<Product, 'id' | 'name' | 'image'> & { handle?: string },
  fallbackImage?: string,
): string {
  const fallback = fallbackImage ?? product.image
  return (
    lookupByProductLineKey(tongueScraperStyleCoverByKey, product) ?? fallback
  )
}

export function getTongueScraperStyleLabel(name: string): string {
  return name.replace(/ Tongue Scraper$/i, '').trim()
}
