import { isWellnessStandaloneProduct } from '@/lib/product-content-slug'
import {
  filterProductsByLineOrder,
  lookupByProductLineKey,
} from '@/lib/product-line-keys'
import type { Product } from '@/lib/types/product'

/** Cover art for wellness flavour picker on PDP. */
export const wellnessFlavorCoverByKey: Record<string, string> = {
  'grape-mint-fruit-energy': '/gelos/grape-mint-fruit-energy.png',
  'full-energy-inhaler-grape-mint': '/gelos/grape-mint-fruit-energy.png',
  '9': '/gelos/grape-mint-fruit-energy.png',

  'aromatherapy-nasal-inhaler': '/gelos/mango-inhaler.png',
  '5': '/gelos/mango-inhaler.png',
}

export const wellnessFlavorOrder = [
  'grape-mint-fruit-energy',
  'full-energy-inhaler-grape-mint',
  'aromatherapy-nasal-inhaler',
  '9',
  '5',
] as const

/** Wellness SKUs with no cross-product flavour picker (serums, oils, etc.). */
export const wellnessStandaloneProductIds = ['28', '29', '31'] as const

export { isWellnessStandaloneProduct }

/** @deprecated Use wellnessFlavorCoverByKey */
export const wellnessFlavorCoverByProductId = wellnessFlavorCoverByKey

export function getWellnessLineVariants<
  T extends { id: string; name?: string; handle?: string },
>(product: T, categoryVariants: T[]): T[] {
  if (
    isWellnessStandaloneProduct({
      id: product.id,
      name: product.name ?? '',
      handle: product.handle,
    })
  ) {
    return [product]
  }

  const line = filterProductsByLineOrder(
    categoryVariants.map((item) => ({
      ...item,
      name: item.name ?? '',
    })),
    wellnessFlavorOrder,
  )

  return line.length > 0 ? (line as T[]) : [product]
}

export function getWellnessFlavorCover(
  product: Pick<Product, 'id' | 'name' | 'image'> & { handle?: string },
  fallbackImage?: string,
): string {
  const fallback = fallbackImage ?? product.image
  return lookupByProductLineKey(wellnessFlavorCoverByKey, product) ?? fallback
}

export function getWellnessFlavorLabel(name: string): string {
  return name
    .replace(/ Fruit Energy$/i, '')
    .replace(/ Nasal Inhaler$/i, '')
    .replace(/^Aromatherapy /i, '')
    .replace(/^Double Nasal /i, '')
    .trim()
}
