import type { CartBundleComponent } from '@/lib/cart-bundle'

export type CartEntry = {
  productId: string
  quantity: number
  /** Selected admin variant image URL (flavour/style tile). */
  variantImage?: string
  /** Display label for the chosen flavour or style. */
  variantLabel?: string
  /** Override unit price (e.g. bundle discount). */
  unitPrice?: number
  /** When set, this cart row is one named bundle (not exploded products). */
  bundleId?: string
  bundleName?: string
  bundleImage?: string
  bundleComponents?: CartBundleComponent[]
}

export type AddToCartOptions = {
  variantImage?: string
  variantLabel?: string
  unitPrice?: number
}

export type CartAddRequest = {
  productId: string
  quantity?: number
  options?: AddToCartOptions
}

export type CartBundleAddRequest = {
  bundleId: string
  bundleName: string
  bundleImage: string
  unitPrice: number
  quantity?: number
  components: CartBundleComponent[]
}

export type AddItemsResult = {
  added: number
  skipped: number
}
