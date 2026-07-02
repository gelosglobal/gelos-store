export type CartEntry = {
  productId: string
  quantity: number
  /** Selected admin variant image URL (flavour/style tile). */
  variantImage?: string
  /** Display label for the chosen flavour or style. */
  variantLabel?: string
  /** Override unit price (e.g. bundle discount). */
  unitPrice?: number
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

export type AddItemsResult = {
  added: number
  skipped: number
}
