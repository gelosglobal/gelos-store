import { normalizeImageUrl } from '@/lib/image-url'
import {
  buildProductLineParent,
  getProductLineParentConfigForProduct,
} from '@/lib/product-line-parents'
import {
  getAvailableStockForVariant,
  getProductVariantPickerOptions,
  productNeedsVariantChoice,
} from '@/lib/product-variant-images'
import type { Product } from '@/lib/types/product'
import type { ProductVariantOption } from '@/lib/types/product-variant'

export { productNeedsVariantChoice }

/**
 * Build the product shown in the bundle flavour dialog.
 * Toothpaste / mouthwash / SonicWave SKUs expand into the full line;
 * multi-style products (e.g. tongue scrapers) keep their own variants.
 */
export function buildBundleVariantChoiceProduct(
  slotProduct: Product,
  allProducts: Product[],
): Product | null {
  if (productNeedsVariantChoice(slotProduct)) {
    return slotProduct
  }

  const config = getProductLineParentConfigForProduct(slotProduct)
  if (!config) return null

  const parent = buildProductLineParent(allProducts, config)
  if (!parent?.variantImageOptions?.length) return null
  if (parent.variantImageOptions.length <= 1) return null

  return {
    ...parent,
    // Keep the bundle slot id so selections/pricing stay keyed to this line.
    id: slotProduct.id,
    name: parent.name,
    image: slotProduct.image,
    price: slotProduct.price,
    stock: slotProduct.stock,
  }
}

export function productNeedsBundleVariantChoice(
  product: Product,
  allProducts: Product[] = [],
): boolean {
  return buildBundleVariantChoiceProduct(product, allProducts) !== null
}

export function getBundleVariantChoiceProducts(
  bundleProducts: Product[],
  allProducts: Product[],
): Product[] {
  return bundleProducts
    .map((product) => buildBundleVariantChoiceProduct(product, allProducts))
    .filter((product): product is Product => Boolean(product))
}

export function getDefaultBundleVariantImage(product: Product): string {
  const options = getProductVariantPickerOptions(product)
  if (options.length === 0) return product.image

  const slotImage = normalizeImageUrl(product.image)
  const matchingSlot = options.find(
    (option) => normalizeImageUrl(option.url) === slotImage,
  )
  if (matchingSlot) return matchingSlot.url

  const inStock = options.find((option) => {
    const stock = option.stock !== undefined ? option.stock : product.stock
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

/** Resolve a dialog selection to the live catalog product + optional style image. */
export function resolveBundleVariantSelection(
  slotProductId: string,
  choiceProduct: Product | undefined,
  selectedImage: string | undefined,
  allProducts: Product[],
): {
  productId: string
  product: Product | undefined
  variantImage?: string
} {
  const slotProduct = allProducts.find((product) => product.id === slotProductId)
  const options = choiceProduct
    ? getProductVariantPickerOptions(choiceProduct)
    : []

  const selected = selectedImage
    ? options.find(
        (option) =>
          normalizeImageUrl(option.url) === normalizeImageUrl(selectedImage),
      )
    : undefined

  if (selected?.sourceProductId) {
    const resolved = allProducts.find(
      (product) => product.id === selected.sourceProductId,
    )
    return {
      productId: selected.sourceProductId,
      product: resolved,
      // Flavour SKUs are single-variant — no style image needed.
      variantImage: undefined,
    }
  }

  return {
    productId: slotProductId,
    product: slotProduct,
    variantImage: selectedImage,
  }
}

export function findBundleVariantOption(
  choiceProduct: Product | undefined,
  selectedImage: string | undefined,
): ProductVariantOption | undefined {
  if (!choiceProduct || !selectedImage) return undefined
  return getProductVariantPickerOptions(choiceProduct).find(
    (option) =>
      normalizeImageUrl(option.url) === normalizeImageUrl(selectedImage),
  )
}
