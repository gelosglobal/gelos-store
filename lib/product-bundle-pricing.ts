import type { Product } from '@/lib/types/product'

export function getResolvableBundleProductIds(
  productIds: string[],
  products: Product[],
): string[] {
  const available = new Set(products.map((product) => product.id))
  return productIds.filter((id) => available.has(id))
}

export function sumProductPrices(
  productIds: string[],
  products: Product[],
): number {
  const byId = new Map(products.map((product) => [product.id, product]))
  return productIds.reduce(
    (sum, id) => sum + (byId.get(id)?.price ?? 0),
    0,
  )
}

/** Individual product total. Bundle price of 0 uses this on the storefront. */
export function getBundleCatalogTotal(
  productIds: string[],
  products: Product[],
): number {
  return sumProductPrices(productIds, products)
}

export function resolveBundlePrice(
  bundle: Pick<ProductBundle, 'price' | 'productIds'>,
  products: Product[],
): number {
  if (bundle.price > 0) return bundle.price
  return getBundleCatalogTotal(bundle.productIds, products)
}

/** Apply bundle discount ratio to a single product line. */
export function getBundleLineUnitPrice(
  productId: string,
  bundlePrice: number,
  productIds: string[],
  products: Product[],
): number | undefined {
  if (bundlePrice <= 0) return undefined

  const catalogTotal = getBundleCatalogTotal(productIds, products)
  if (catalogTotal <= 0) return undefined

  const product = products.find((item) => item.id === productId)
  if (!product) return undefined

  const ratio = bundlePrice / catalogTotal
  return Math.round(product.price * ratio * 100) / 100
}
