'use client'

import { ProductImageUrlsField } from '@/components/admin/product-image-urls-field'

const MAX_VARIANT_IMAGES = 8

type ProductVariantImagesFieldProps = {
  value: string[]
  onChange: (urls: string[]) => void
}

export function ProductVariantImagesField({
  value,
  onChange,
}: ProductVariantImagesFieldProps) {
  return (
    <ProductImageUrlsField
      value={value}
      onChange={onChange}
      maxImages={MAX_VARIANT_IMAGES}
      description="Flavour/style picker on the product page and shop cards (first three show on cards; +N for more). Each image also appears in the page gallery carousel. Remove any you do not want shown."
      addButtonLabel="Add variant image"
      listItemAltPrefix="Variant"
    />
  )
}
