'use client'

import { ProductImageUrlsField } from '@/components/admin/product-image-urls-field'

const MAX_GALLERY_IMAGES = 10

type ProductGalleryImagesFieldProps = {
  value: string[]
  onChange: (urls: string[]) => void
}

export function ProductGalleryImagesField({
  value,
  onChange,
}: ProductGalleryImagesFieldProps) {
  return (
    <ProductImageUrlsField
      value={value}
      onChange={onChange}
      maxImages={MAX_GALLERY_IMAGES}
      description="Lifestyle and detail images shown below the product description on the store. Variant images above are separate — they power “Choose your flavour/style” and the main product carousel."
      addButtonLabel="Add gallery image"
      listItemAltPrefix="Gallery"
    />
  )
}
