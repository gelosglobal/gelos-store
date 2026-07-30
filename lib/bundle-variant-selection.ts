import { normalizeImageUrl } from '@/lib/image-url'
import {
  buildProductLineParent,
  getProductLineParentConfigForCategory,
} from '@/lib/product-line-parents'
import {
  getAvailableStockForVariant,
  getProductVariantPickerOptions,
  productNeedsVariantChoice,
} from '@/lib/product-variant-images'
import type { Product } from '@/lib/types/product'
import type { ProductVariantOption } from '@/lib/types/product-variant'

export { productNeedsVariantChoice }

const SONICWAVE_NAME_RE = /sonicwave\s*g1\s*series\s*electric\s*toothbrush/i

function sonicwaveColorLabel(name: string): string {
  const match = name.match(/-\s*([^-]+)\s*$/)
  return match?.[1]?.trim() || name
}

/** Group SonicWave colour SKUs into one style picker for bundles. */
function buildSonicwaveChoiceProduct(
  slotProduct: Product,
  allProducts: Product[],
): Product | null {
  if (!SONICWAVE_NAME_RE.test(slotProduct.name)) return null

  const siblings = allProducts.filter(
    (product) =>
      product.active !== false && SONICWAVE_NAME_RE.test(product.name),
  )
  if (siblings.length <= 1) return null

  const options: ProductVariantOption[] = []
  const seen = new Set<string>()
  for (const sibling of siblings) {
    const url = normalizeImageUrl(sibling.image)
    if (!url || seen.has(url)) continue
    seen.add(url)
    options.push({
      url,
      label: sonicwaveColorLabel(sibling.name),
      stock: sibling.stock,
      shopifyVariantGid: sibling.shopifyVariantGid,
      sourceProductId: sibling.id,
    })
  }
  if (options.length <= 1) return null

  return {
    ...slotProduct,
    name: 'SonicWave G1 Electric Toothbrush',
    variantImages: options.map((option) => option.url),
    variantImageOptions: options,
    carouselImages: options.map((option) => option.url),
  }
}

/**
 * Build the product shown in the bundle flavour dialog.
 * Toothpaste/mouthwash SKUs expand into the full line of flavours;
 * SonicWave colours group as style choices;
 * multi-style products (e.g. tongue scrapers) keep their own variants.
 */
export function buildBundleVariantChoiceProduct(
  slotProduct: Product,
  allProducts: Product[],
): Product | null {
  if (productNeedsVariantChoice(slotProduct)) {
    return slotProduct
  }

  const sonicwave = buildSonicwaveChoiceProduct(slotProduct, allProducts)
  if (sonicwave) return sonicwave

  const config = getProductLineParentConfigForCategory(slotProduct.category)
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
