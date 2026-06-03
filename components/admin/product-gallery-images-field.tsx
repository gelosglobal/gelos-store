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
      description="Extra carousel thumbnails on the product page (below the hero). When you add any gallery image here, it replaces old built-in defaults. Variant images above are separate — they power “Choose your flavour/style” and also appear in the carousel."
      addButtonLabel="Add gallery image"
      listItemAltPrefix="Gallery"
    />
  )
}
