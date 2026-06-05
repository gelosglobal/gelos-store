export type CartEntry = {
  productId: string
  quantity: number
  /** Selected admin variant image URL (flavour/style tile). */
  variantImage?: string
  /** Display label for the chosen flavour or style. */
  variantLabel?: string
}

export type AddToCartOptions = {
  variantImage?: string
  variantLabel?: string
}
