import {
  getAvailableStockForVariant,
  getProductVariantPickerOptions,
  productNeedsVariantChoice,
} from '@/lib/product-variant-images'
import type { Product } from '@/lib/types/product'

export { productNeedsVariantChoice }

export function productNeedsBundleVariantChoice(product: Product): boolean {
  return productNeedsVariantChoice(product)
}

export function getDefaultBundleVariantImage(product: Product): string {
  const options = getProductVariantPickerOptions(product)
  const inStock = options.find((option) => {
    const stock =
      option.stock !== undefined ? option.stock : product.stock
    return stock > 0
  })

  return (inStock ?? options[0])?.url ?? product.image
}

export function isBundleVariantInStock(
  product: Product,
  variantImage: string,
): boolean {
  return getAvailableStockForVariant(product, variantImage) > 0
}

export function buildDefaultBundleVariantSelections(
  products: Product[],
): Record<string, string> {
  return Object.fromEntries(
    products.map((product) => [
      product.id,
      getDefaultBundleVariantImage(product),
    ]),
  )
}
