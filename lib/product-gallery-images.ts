import { normalizeImageUrl } from '@/lib/image-url'
import { normalizeVariantImages } from '@/lib/product-variant-images'

/** Normalize gallery image URLs for storage and display. */
export function normalizeGalleryImages(
  urls: string[] | undefined | null,
): string[] {
  return normalizeVariantImages(urls)
}

/** Admin gallery images for the feature strip below the product description. */
export function getAdminGalleryImages(product: {
  galleryImages?: string[]
}): string[] {
  return normalizeGalleryImages(product.galleryImages)
}

/** Built-in PDP carousel extras from code defaults only (not admin uploads). */
export function getCodeDefaultGalleryImages(
  galleryImages: string[],
): string[] {
  return galleryImages.map((src) => normalizeImageUrl(src))
}
