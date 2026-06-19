import type { ProductTagId } from '@/lib/product-tags'
import type { ProductVariantOption } from '@/lib/types/product-variant'

export type Product = {
  id: string
  name: string
  category: string
  price: number
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
  /** Extra images in the product page gallery carousel. */
  galleryImages: string[]
  /** When false, product is hidden from the storefront (draft). */
  active?: boolean
}
