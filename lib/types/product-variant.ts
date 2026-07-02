export type ProductVariantOption = {
  url: string
  label: string
  /** Units available for this flavour/style. Omit to use product-level stock. */
  stock?: number
}
