import { bestSellerMeta } from '@/lib/best-seller-meta'
import { normalizeImageUrl } from '@/lib/image-url'
import type { ProductVariantOption } from '@/lib/types/product-variant'
import { getVariantLabelFromImageUrl } from '@/lib/variant-image-labels'

function isVariantOption(value: unknown): value is ProductVariantOption {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return typeof record.url === 'string'
}

function parseVariantStock(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return undefined
  return Math.max(0, Math.floor(parsed))
}

/** Parse variant options from DB JSON or legacy URL arrays. */
export function normalizeVariantImageOptions(
  options: unknown,
  legacyUrls?: string[] | null,
): ProductVariantOption[] {
  const seen = new Set<string>()
  const result: ProductVariantOption[] = []

  const push = (rawUrl: string, rawLabel?: string, rawStock?: unknown) => {
    const trimmed = rawUrl.trim()
    if (!trimmed || trimmed === '/placeholder.svg') return
    const url = normalizeImageUrl(trimmed)
    if (seen.has(url)) return
    seen.add(url)
    const stock = parseVariantStock(rawStock)
    result.push({
      url,
      label: typeof rawLabel === 'string' ? rawLabel.trim() : '',
      ...(stock !== undefined ? { stock } : {}),
    })
  }

  if (Array.isArray(options)) {
    for (const item of options) {
      if (typeof item === 'string') {
        push(item)
        continue
      }
      if (isVariantOption(item)) {
        push(item.url, item.label, item.stock)
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

/** True when the product uses admin-uploaded variant tiles on the PDP. */
export function hasAdminVariantPicker(product: {
  variantImages?: string[]
  variantImageOptions?: ProductVariantOption[]
}): boolean {
  return (
    getAdminVariantImageOptions(product).length > 0 ||
    getAdminVariantImages(product).length > 0
  )
}

/** Default hero/card image — first admin variant when configured, else main product image. */
export function getDefaultVariantDisplayImage(product: {
  id?: string
  image: string
  name?: string
  category?: string
  variantImages?: string[]
  variantImageOptions?: ProductVariantOption[]
}): string {
  const variants = getEffectiveVariantImages(
    product as Parameters<typeof getEffectiveVariantImages>[0],
  )
  if (variants.length > 0) return variants[0]
  return normalizeImageUrl(product.image)
}

export function getAdminVariantOptionForUrl(
  product: { variantImageOptions?: ProductVariantOption[] },
  url: string,
): ProductVariantOption | undefined {
  const normalized = normalizeImageUrl(url)
  return getAdminVariantImageOptions(product).find(
    (option) => normalizeImageUrl(option.url) === normalized,
  )
}

function resolveVariantOptionLabel(
  product: {
    image: string
    name: string
    category: string
    variantImageOptions?: ProductVariantOption[]
  },
  url: string,
): string {
  const storedOption = getAdminVariantOptionForUrl(product, url)
  if (storedOption) {
    // Respect admin input — an intentionally cleared name stays empty.
    return storedOption.label.trim()
  }

  const fromUrl = getVariantLabelFromImageUrl(url, product.category)
  if (fromUrl) return fromUrl

  return getVariantLabelFromImageUrl(url, product.category) || 'Variant'
}

function dedupeVariantOptions(
  options: ProductVariantOption[],
): ProductVariantOption[] {
  const seen = new Set<string>()
  const result: ProductVariantOption[] = []

  for (const option of options) {
    const url = normalizeImageUrl(option.url)
    if (seen.has(url)) continue
    seen.add(url)
    result.push({
      url,
      label: option.label,
      ...(option.stock !== undefined ? { stock: option.stock } : {}),
    })
  }

  return result
}

/** Label for a variant image — admin name wins, then filename heuristics. */
export function getVariantLabelForImage(
  product: {
    image: string
    name: string
    category: string
    variantImages?: string[]
    variantImageOptions?: ProductVariantOption[]
  },
  imageUrl: string,
): string | undefined {
  const storedOption = getAdminVariantOptionForUrl(product, imageUrl)

  if (storedOption) {
    return storedOption.label.trim() || undefined
  }

  const fromUrl = getVariantLabelFromImageUrl(imageUrl, product.category)
  if (fromUrl) return fromUrl

  return undefined
}

/** Admin variant images for PDP picker and gallery sync (no auto-injected main image). */
export function getProductPickerImages(product: {
  image: string
  variantImages?: string[]
  variantImageOptions?: ProductVariantOption[]
}): string[] {
  const admin = getAdminVariantImages(product)
  if (admin.length > 0) {
    const seen = new Set<string>()
    return admin.filter((url) => {
      const normalized = normalizeImageUrl(url)
      if (seen.has(normalized)) return false
      seen.add(normalized)
      return true
    })
  }

  return [normalizeImageUrl(product.image)]
}

/** Picker tiles — only images saved in admin (removing one in admin removes it from the storefront). */
export function getProductVariantPickerOptions(product: {
  image: string
  name: string
  category: string
  variantImages?: string[]
  variantImageOptions?: ProductVariantOption[]
}): ProductVariantOption[] {
  const options = getAdminVariantImageOptions(product)

  if (options.length > 0) {
    return dedupeVariantOptions(
      options.map((option) => ({
        url: normalizeImageUrl(option.url),
        label: resolveVariantOptionLabel(product, option.url),
        ...(option.stock !== undefined ? { stock: option.stock } : {}),
      })),
    )
  }

  return dedupeVariantOptions(
    getAdminVariantImages(product).map((url) => ({
      url: normalizeImageUrl(url),
      label: resolveVariantOptionLabel(product, url),
    })),
  )
}

/**
 * When variant images are managed in admin, keep the main product image aligned:
 * if the current main image is no longer in the variant list, promote the first variant.
 */
export function syncMainImageWithVariantOptions(
  mainImage: string,
  variantOptions: ProductVariantOption[],
): string {
  const main = normalizeImageUrl(mainImage.trim() || '/placeholder.svg')
  const variantUrls = normalizeVariantImageOptions(variantOptions).map((option) =>
    normalizeImageUrl(option.url),
  )

  if (variantUrls.length === 0) return main
  if (variantUrls.includes(main)) return main

  return variantUrls[0]
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

export function hasVariantLevelInventory(
  options: ProductVariantOption[] | undefined | null,
): boolean {
  return normalizeVariantImageOptions(options).some(
    (option) => option.stock !== undefined,
  )
}

export function sumVariantInventory(
  options: ProductVariantOption[] | undefined | null,
): number {
  return normalizeVariantImageOptions(options).reduce(
    (sum, option) => sum + (option.stock ?? 0),
    0,
  )
}

export function getVariantStockForImage(
  product: { variantImageOptions?: ProductVariantOption[] },
  imageUrl: string,
): number | undefined {
  const option = getAdminVariantOptionForUrl(product, imageUrl)
  return option?.stock
}

/** Variant stock when set, otherwise product-level stock. */
export function getAvailableStockForVariant(
  product: { stock: number; variantImageOptions?: ProductVariantOption[] },
  variantImageUrl?: string,
): number {
  if (variantImageUrl) {
    const variantStock = getVariantStockForImage(product, variantImageUrl)
    if (variantStock !== undefined) return variantStock
  }
  return product.stock
}

/** DB variant images, with legacy best-seller meta fallback when empty. */
export function getEffectiveVariantImages(product: {
  id: string
  image: string
  name: string
  category: string
  variantImages?: string[]
  variantImageOptions?: ProductVariantOption[]
}): string[] {
  if (hasAdminVariantPicker(product)) {
    return getProductVariantPickerOptions(product).map((option) => option.url)
  }

  const legacy = normalizeVariantImages(bestSellerMeta[product.id]?.variantImages)
  return legacy
}

export function getEffectiveVariantImageOptions(product: {
  id: string
  image: string
  name: string
  category: string
  variantImages?: string[]
  variantImageOptions?: ProductVariantOption[]
}): ProductVariantOption[] {
  if (hasAdminVariantPicker(product)) {
    return getProductVariantPickerOptions(product)
  }

  const legacy = normalizeVariantImages(bestSellerMeta[product.id]?.variantImages)
  return legacy.map((url) => ({
    url,
    label: getVariantLabelFromImageUrl(url, product.category) || '',
  }))
}
