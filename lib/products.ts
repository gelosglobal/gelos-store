/**
 * Server-side product API. Client components must import getProductHref from
 * @/lib/product-utils and Product from @/lib/types/product — not this barrel.
 */
export type { Product } from '@/lib/types/product'
export { getProductSlug } from '@/lib/product-utils'
export {
  getAllProducts,
  getAllProductSlugs,
  getProductBySlugOrId,
  getRelatedProducts,
} from '@/lib/db/products'

/** @deprecated Use getAllProducts() — kept for admin mock pages */
export { products } from '@/lib/mock-data'
