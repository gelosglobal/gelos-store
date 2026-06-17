import type { ProductTagId } from '@/lib/product-tags'
import type { Product } from '@/lib/types/product'
import type { ProductVariantOption } from '@/lib/types/product-variant'

export type AdminProductInput = {
  name: string
  category: string
  price: number
  stock: number
  description: string
  image: string
  rating?: number
  reviews?: number
  tags?: ProductTagId[]
  variantImageOptions?: ProductVariantOption[]
  variantImages?: string[]
  galleryImages?: string[]
}

export type AdminProduct = Product

export type AdminDashboardStats = {
  totalProducts: number
  lowStock: number
  categories: { name: string; count: number }[]
  toothpasteCount: number
  mouthwashCount: number
}
