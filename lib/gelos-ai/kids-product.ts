import type { SmileScanCatalogProduct } from '@/lib/gelos-ai/smile-scan-catalog'

const KIDS_NAME_PATTERN =
  /\b(kid|kids|kid'?s|child|children|child'?s|junior|toddler|baby)\b/i

export function isKidsProductName(name: string): boolean {
  return KIDS_NAME_PATTERN.test(name)
}

export function isKidsCatalogProduct(
  product: Pick<SmileScanCatalogProduct, 'name' | 'slug' | 'description'>,
): boolean {
  return (
    isKidsProductName(product.name) ||
    isKidsProductName(product.slug.replace(/-/g, ' ')) ||
    isKidsProductName(product.description)
  )
}

export function isElectricToothbrushName(name: string): boolean {
  return /\b(sonic|electric|3d)\b/i.test(name)
}

export function isToothbrushCategory(category: string): boolean {
  return category.toLowerCase() === 'toothbrushes'
}
