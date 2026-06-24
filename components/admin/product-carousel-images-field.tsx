'use client'

import { ProductImageUrlsField } from '@/components/admin/product-image-urls-field'

const MAX_CAROUSEL_IMAGES = 10

type ProductCarouselImagesFieldProps = {
  value: string[]
  onChange: (urls: string[]) => void
}

export function ProductCarouselImagesField({
  value,
  onChange,
}: ProductCarouselImagesFieldProps) {
  return (
    <ProductImageUrlsField
      value={value}
      onChange={onChange}
      maxImages={MAX_CAROUSEL_IMAGES}
      description="Optional thumbnails shown under the main product image on the store. Leave empty to use variant images automatically."
      addButtonLabel="Add carousel image"
      listItemAltPrefix="Carousel"
    />
  )
}
