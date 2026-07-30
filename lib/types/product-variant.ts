export type ProductVariantOption = {
  url: string
  label: string
  /** Units available for this flavour/style. Omit to use product-level stock. */
  stock?: number
  /** Shopify variant GID — used when commerce runs on Storefront API. */
  shopifyVariantGid?: string
  /**
   * Real catalogue product id for this flavour tile when shown on a
   * synthetic line parent (e.g. Flavored Toothpaste).
   */
  sourceProductId?: string
}
