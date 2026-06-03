import { normalizeVariantImages } from '@/lib/product-variant-images'

/** Normalize gallery image URLs for storage and display. */
export function normalizeGalleryImages(
  urls: string[] | undefined | null,
): string[] {
  return normalizeVariantImages(urls)
}

/** Extra gallery images saved in admin (product page carousel). */
export function getAdminGalleryImages(product: {
  galleryImages?: string[]
}): string[] {
  return normalizeGalleryImages(product.galleryImages)
}
