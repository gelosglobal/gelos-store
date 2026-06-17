import { bestSellerMeta } from '@/lib/best-seller-meta'
import { normalizeImageUrl } from '@/lib/image-url'
import type { ProductVariantOption } from '@/lib/types/product-variant'
import { getVariantLabelFromImageUrl } from '@/lib/variant-image-labels'

function isVariantOption(value: unknown): value is ProductVariantOption {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return typeof record.url === 'string'
}

/** Parse variant options from DB JSON or legacy URL arrays. */
export function normalizeVariantImageOptions(
  options: unknown,
  legacyUrls?: string[] | null,
): ProductVariantOption[] {
  const seen = new Set<string>()
  const result: ProductVariantOption[] = []

  const push = (rawUrl: string, rawLabel?: string) => {
    const trimmed = rawUrl.trim()
    if (!trimmed || trimmed === '/placeholder.svg') return
    const url = normalizeImageUrl(trimmed)
    if (seen.has(url)) return
    seen.add(url)
    result.push({
      url,
      label: typeof rawLabel === 'string' ? rawLabel.trim() : '',
    })
  }

  if (Array.isArray(options)) {
    for (const item of options) {
      if (typeof item === 'string') {
        push(item)
        continue
      }
      if (isVariantOption(item)) {
        push(item.url, item.label)
      }
    }
  }

  if (result.length === 0 && legacyUrls?.length) {
    for (const url of legacyUrls) {
      push(url)
    }
  }

  return result
}

/** Normalize variant image URLs for storage and display. */
export function normalizeVariantImages(
  urls: string[] | undefined | null,
): string[] {
  return normalizeVariantImageOptions(null, urls).map((option) => option.url)
}

/** Variant options saved in admin (no legacy fallback). */
export function getAdminVariantImageOptions(product: {
  variantImageOptions?: ProductVariantOption[]
}): ProductVariantOption[] {
  return normalizeVariantImageOptions(product.variantImageOptions)
}

/** Variant images saved in admin (no legacy fallback). */
export function getAdminVariantImages(product: {
  variantImages?: string[]
  variantImageOptions?: ProductVariantOption[]
}): string[] {
  const options = getAdminVariantImageOptions(product)
  if (options.length > 0) return options.map((option) => option.url)
  return normalizeVariantImages(product.variantImages)
}

/** Label for a variant image — admin name wins, then filename heuristics. */
export function getVariantLabelForImage(
  product: {
    category: string
    variantImageOptions?: ProductVariantOption[]
  },
  imageUrl: string,
): string | undefined {
  const normalized = normalizeImageUrl(imageUrl)
  const stored = getAdminVariantImageOptions(product).find(
    (option) => normalizeImageUrl(option.url) === normalized,
  )?.label

  if (stored) return stored
  return getVariantLabelFromImageUrl(imageUrl, product.category)
}

/** Main + admin variant images for PDP picker and gallery sync. */
export function getProductPickerImages(product: {
  image: string
  variantImages?: string[]
  variantImageOptions?: ProductVariantOption[]
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

/** Picker tiles for admin-configured variants (excludes duplicate main image when unlabeled). */
export function getProductVariantPickerOptions(product: {
  image: string
  category: string
  variantImages?: string[]
  variantImageOptions?: ProductVariantOption[]
}): ProductVariantOption[] {
  const main = normalizeImageUrl(product.image)
  const options = getAdminVariantImageOptions(product)

  if (options.length > 0) {
    return options.map((option) => ({
      url: option.url,
      label:
        option.label ||
        getVariantLabelFromImageUrl(option.url, product.category) ||
        'Variant',
    }))
  }

  return getAdminVariantImages(product)
    .filter((url) => url !== main)
    .map((url) => ({
      url,
      label: getVariantLabelFromImageUrl(url, product.category) || 'Variant',
    }))
}

export function getVariantPickerLabel(category: string): string {
  if (category === 'Tongue Scraper') return 'Choose your style'
  if (category === 'Whitening') return 'Choose your treatment'
  if (category === 'Toothbrushes') return 'Choose your brush'
  if (category === 'Water Flossers') return 'Choose your flosser'
  if (category === 'Accessories') return 'Choose your option'
  if (category === 'Tools') return 'Choose your tool'
  return 'Choose your flavour'
}

/** DB variant images, with legacy best-seller meta fallback when empty. */
export function getEffectiveVariantImages(product: {
  id: string
  variantImages?: string[]
  variantImageOptions?: ProductVariantOption[]
}): string[] {
  const stored = getAdminVariantImages(product)
  if (stored.length > 0) return stored
  return normalizeVariantImages(bestSellerMeta[product.id]?.variantImages)
}

export function getEffectiveVariantImageOptions(product: {
  id: string
  category: string
  variantImages?: string[]
  variantImageOptions?: ProductVariantOption[]
}): ProductVariantOption[] {
  const stored = getAdminVariantImageOptions(product)
  if (stored.length > 0) {
    return stored.map((option) => ({
      url: option.url,
      label:
        option.label ||
        getVariantLabelFromImageUrl(option.url, product.category) ||
        '',
    }))
  }

  const legacy = normalizeVariantImages(bestSellerMeta[product.id]?.variantImages)
  return legacy.map((url) => ({
    url,
    label: getVariantLabelFromImageUrl(url, product.category) || '',
  }))
}
