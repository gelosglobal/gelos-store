import {
  filterProductsByLineOrder,
  lookupByProductLineKey,
  productMatchesLineKeys,
} from '@/lib/product-line-keys'
import type { Product } from '@/lib/types/product'

/** Cover art for whitening treatment picker on PDP. */
export const whiteningTreatmentCoverByKey: Record<string, string> = {
  'v34-shade-correction-kit': '/gelos/GELOS1967.jpg',
  'v34-teeth-whitening-kit': '/gelos/GELOS1967.jpg',
  'v34-colour-correcting-serum': '/gelos/GELOS1967.jpg',
  'v34-color-correcting-serum': '/gelos/GELOS1967.jpg',
  'v34-3-in-1-shade-correction-kit': '/gelos/GELOS1967.jpg',
  '3': '/gelos/GELOS1967.jpg',
}

/** Whitening products with no cross-product treatment picker (standalone SKUs). */
export const whiteningStandaloneKeys = [
  'premium-whitening-strips-30-pairs',
  'teeth-whitening-strips-pap',
  'activated-charcoal-powder',
  'led-whitening-device',
  'teeth-whitening-kit',
  // V34 kit + serum are separate PDPs — do not share a treatment picker
  // (covers were identical lifestyle shots and looked like broken variants).
  'v34-shade-correction-kit',
  'v34-teeth-whitening-kit',
  'v34-3-in-1-shade-correction-kit',
  'v34-colour-correcting-serum',
  'v34-color-correcting-serum',
  '7',
  '10',
  '3',
  '39',
] as const

export const whiteningStandaloneProductIds = [
  '7',
  '10',
  '3',
  '39',
] as const

export const whiteningTreatmentOrder = [
  'v34-shade-correction-kit',
  'v34-teeth-whitening-kit',
  'v34-3-in-1-shade-correction-kit',
  '3',
] as const

/** @deprecated Use whiteningTreatmentCoverByKey */
export const whiteningTreatmentCoverByProductId = whiteningTreatmentCoverByKey

export function isWhiteningStandaloneProduct(
  product: Pick<Product, 'id' | 'name'> & { handle?: string } | string,
): boolean {
  if (typeof product === 'string') {
    return (whiteningStandaloneProductIds as readonly string[]).includes(
      product,
    )
  }
  return productMatchesLineKeys(product, whiteningStandaloneKeys)
}

export function getWhiteningLineVariants<
  T extends { id: string; name?: string; handle?: string },
>(product: T, categoryVariants: T[]): T[] {
  if (
    isWhiteningStandaloneProduct({
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
    whiteningTreatmentOrder,
  )

  return line.length > 0 ? (line as T[]) : [product]
}

export function getWhiteningTreatmentCover(
  product: Pick<Product, 'id' | 'name' | 'image'> & { handle?: string },
  fallbackImage?: string,
): string {
  const fallback = fallbackImage ?? product.image
  return (
    lookupByProductLineKey(whiteningTreatmentCoverByKey, product) ?? fallback
  )
}

export function getWhiteningTreatmentLabel(name: string): string {
  return name
    .replace(/ \(30 pairs\)$/i, '')
    .replace(/^Premium /i, '')
    .replace(/^Activated /i, '')
    .trim()
}
