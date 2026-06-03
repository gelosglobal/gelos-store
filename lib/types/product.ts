import type { ProductTagId } from '@/lib/product-tags'

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
  /** Extra images in the product page gallery carousel. */
  galleryImages: string[]
}
