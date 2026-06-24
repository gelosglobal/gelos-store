import { normalizeImageUrl } from '@/lib/image-url'
import { normalizeVariantImages } from '@/lib/product-variant-images'

export const GALLERY_VIDEO_PREFIX = 'video:'

export type GalleryMediaItem =
  | { type: 'image'; url: string }
  | { type: 'video'; url: string }

export function isGalleryVideoEntry(raw: string): boolean {
  return raw.startsWith(GALLERY_VIDEO_PREFIX)
}

export function encodeGalleryVideo(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return ''
  return `${GALLERY_VIDEO_PREFIX}${trimmed}`
}

export function parseGalleryMediaItem(raw: string): GalleryMediaItem | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  if (isGalleryVideoEntry(trimmed)) {
    const url = trimmed.slice(GALLERY_VIDEO_PREFIX.length).trim()
    return url ? { type: 'video', url } : null
  }

  const url = normalizeImageUrl(trimmed)
  if (!url || url === '/placeholder.svg') return null
  return { type: 'image', url }
}

/** Normalize gallery entries (images and optional `video:` prefixed URLs). */
export function normalizeGalleryImages(
  urls: string[] | undefined | null,
): string[] {
  if (!Array.isArray(urls)) return []

  const seen = new Set<string>()
  const result: string[] = []

  for (const raw of urls) {
    const item = parseGalleryMediaItem(String(raw))
    if (!item) continue
    const key =
      item.type === 'video' ? encodeGalleryVideo(item.url) : item.url
    if (seen.has(key)) continue
    seen.add(key)
    result.push(key)
  }

  return result
}

/** Admin gallery media for the feature strip below the product description. */
export function getAdminGalleryMedia(product: {
  galleryImages?: string[]
}): GalleryMediaItem[] {
  return normalizeGalleryImages(product.galleryImages)
    .map(parseGalleryMediaItem)
    .filter((item): item is GalleryMediaItem => item !== null)
}

/** Image-only gallery URLs (videos excluded). */
export function getAdminGalleryImages(product: {
  galleryImages?: string[]
}): string[] {
  return getAdminGalleryMedia(product)
    .filter((item) => item.type === 'image')
    .map((item) => item.url)
}

/** Admin carousel thumbnails under the main product image. */
export function getAdminCarouselImages(product: {
  carouselImages?: string[]
}): string[] {
  return normalizeGalleryImages(product.carouselImages)
}

type ProductCarouselInput = {
  product: {
    image: string
    carouselImages?: string[]
    variantImages?: string[]
    variantImageOptions?: import('@/lib/types/product-variant').ProductVariantOption[]
  }
  pickerImages: string[]
  contentGalleryFallback: string[]
  featureImages: string[]
  hasAdminVariants: boolean
  activeImage: string
}

/** Thumbnail strip under the hero image — custom uploads, else variant images. */
export function getProductCarouselImages(input: ProductCarouselInput): string[] {
  const custom = getAdminCarouselImages(input.product)
  if (custom.length > 0) return custom

  const featureSet = new Set(
    input.featureImages.map((src) => normalizeImageUrl(src)),
  )
  const codeFallback = input.contentGalleryFallback
    .map((s) => normalizeImageUrl(s))
    .filter((url) => !featureSet.has(url))

  const extraGallery = input.hasAdminVariants ? [] : codeFallback

  const seen = new Set<string>()
  const merged: string[] = []
  const sources = input.hasAdminVariants
    ? [...input.pickerImages, ...extraGallery]
    : [input.activeImage, ...input.pickerImages, ...extraGallery]

  for (const src of sources) {
    const url = normalizeImageUrl(src)
    if (seen.has(url) || featureSet.has(url)) continue
    seen.add(url)
    merged.push(url)
  }

  return merged.length > 0 ? merged : ['/placeholder.svg']
}

/** Built-in PDP carousel extras from code defaults only (not admin uploads). */
export function getCodeDefaultGalleryImages(
  galleryImages: string[],
): string[] {
  return galleryImages.map((src) => normalizeImageUrl(src))
}
