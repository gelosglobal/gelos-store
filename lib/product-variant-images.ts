import { bestSellerMeta } from '@/lib/best-seller-meta'
import { normalizeImageUrl } from '@/lib/image-url'

/** Normalize variant image URLs for storage and display. */
export function normalizeVariantImages(urls: string[] | undefined | null): string[] {
  if (!urls?.length) return []
  const seen = new Set<string>()
  const result: string[] = []
  for (const raw of urls) {
    const trimmed = raw.trim()
    if (!trimmed || trimmed === '/placeholder.svg') continue
    const url = normalizeImageUrl(trimmed)
    if (seen.has(url)) continue
    seen.add(url)
    result.push(url)
  }
  return result
}

/** Variant images saved in admin (no legacy fallback). */
export function getAdminVariantImages(product: {
  variantImages?: string[]
}): string[] {
  return normalizeVariantImages(product.variantImages)
}

/** Main + admin variant images for PDP picker and gallery sync. */
export function getProductPickerImages(product: {
  image: string
  variantImages?: string[]
}): string[] {
  const main = normalizeImageUrl(product.image)
  const seen = new Set<string>()
  const result: string[] = []

  for (const url of [main, ...getAdminVariantImages(product)]) {
    if (seen.has(url)) continue
    seen.add(url)
    result.push(url)
  }

  return result
}

export function getVariantPickerLabel(category: string): string {
  if (category === 'Tongue Scraper') return 'Choose your style'
  if (category === 'Whitening') return 'Choose your treatment'
  if (category === 'Toothbrushes') return 'Choose your brush'
  if (category === 'Accessories') return 'Choose your option'
  if (category === 'Tools') return 'Choose your tool'
  return 'Choose your flavour'
}

/** DB variant images, with legacy best-seller meta fallback when empty. */
export function getEffectiveVariantImages(product: {
  id: string
  variantImages?: string[]
}): string[] {
  const stored = normalizeVariantImages(product.variantImages)
  if (stored.length > 0) return stored
  return normalizeVariantImages(bestSellerMeta[product.id]?.variantImages)
}
