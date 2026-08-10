import type { ProductTagId } from '@/lib/product-tags'
import type { ProductVariantOption } from '@/lib/types/product-variant'

export type Product = {
  id: string
  name: string
  category: string
  price: number
  /**
   * Optional “was” price (Shopify compare-at). Shown struck through when
   * greater than `price`.
   */
  compareAtPrice?: number
  rating: number
  reviews: number
  image: string
  description: string
  stock: number
  tags: ProductTagId[]
  /** Thumbnail images shown on product cards (flavor / variant picker). */
  variantImages: string[]
  /** Named flavour/style options saved in admin (url + label). */
  variantImageOptions: ProductVariantOption[]
  /** Extra images in the feature gallery below the product description. */
  galleryImages: string[]
  /** Thumbnail strip under the main product image; uses variant images when empty. */
  carouselImages: string[]
  /** When false, product is hidden from the storefront (draft). */
  active?: boolean
  /** Shopify Product GID when catalog is sourced from Storefront API. */
  shopifyProductGid?: string
  /** Default Shopify variant GID (merchandiseId) for cart/checkout. */
  shopifyVariantGid?: string
  /** Shopify product handle (URL slug on Shopify). */
  handle?: string
  /** Parsed Shopify custom.pdp metafield (headline, FAQ, usage steps, etc.). */
  shopifyPdpContent?: Partial<import('@/lib/product-pdp-content').ProductPdpContent> | null
}
