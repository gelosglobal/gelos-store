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

const UPLOADTHING_FILE_ID =
  /(?:\/(?:f|files)\/)(23U54rrg34KJ[A-Za-z0-9]+)/i
const SHOPIFY_UUID_SUFFIX =
  /_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=\.[a-z0-9]+$)/i

/**
 * Collapse CDN + UploadThing + Shopify UUID clones of the same asset.
 * Prefers UploadThing / non-UUID URLs when duplicates collide.
 */
export function dedupeGallerySourceEntries(entries: string[]): string[] {
  return dedupeGallerySourceEntriesWithMeta(
    entries.map((raw) => ({ raw, dispositionName: null })),
  )
}

/**
 * Same as {@link dedupeGallerySourceEntries}, but uses Content-Disposition
 * filenames (from HEAD) so UploadThing IDs merge with Shopify-named copies.
 */
export async function dedupeGallerySourceEntriesAsync(
  entries: string[],
): Promise<string[]> {
  const metas = await Promise.all(
    entries.map(async (raw) => {
      const item = parseGalleryMediaItem(String(raw))
      if (!item) return { raw, dispositionName: null as string | null }
      const dispositionName = await peekRemoteFilename(item.url)
      return { raw, dispositionName }
    }),
  )
  return dedupeGallerySourceEntriesWithMeta(metas)
}

function dedupeGallerySourceEntriesWithMeta(
  entries: Array<{ raw: string; dispositionName: string | null }>,
): string[] {
  type Row = {
    index: number
    normalized: string
    keys: string[]
    score: number
  }

  const rows: Row[] = []
  for (let index = 0; index < entries.length; index++) {
    const entry = entries[index]
    const item = parseGalleryMediaItem(String(entry.raw))
    if (!item) continue
    const url = item.url.trim()
    rows.push({
      index,
      normalized: item.type === 'video' ? encodeGalleryVideo(url) : url,
      keys: gallerySourceDedupeKeys(url, entry.dispositionName),
      score: gallerySourcePreferenceScore(url, item.type === 'video'),
    })
  }

  const parent = new Map<string, string>()
  const find = (key: string): string => {
    const current = parent.get(key) ?? key
    if (current === key) return key
    const root = find(current)
    parent.set(key, root)
    return root
  }
  const union = (a: string, b: string) => {
    const ra = find(a)
    const rb = find(b)
    if (ra !== rb) parent.set(ra, rb)
  }

  for (const row of rows) {
    for (let i = 1; i < row.keys.length; i++) {
      union(row.keys[0], row.keys[i])
    }
  }

  const bestByRoot = new Map<string, Row>()
  for (const row of rows) {
    const root = find(row.keys[0] || `solo:${row.index}`)
    const existing = bestByRoot.get(root)
    if (
      !existing ||
      row.score > existing.score ||
      (row.score === existing.score && row.index < existing.index)
    ) {
      bestByRoot.set(root, row)
    }
  }

  const winners = new Set(
    [...bestByRoot.values()].map((row) => row.normalized),
  )
  const ordered: string[] = []
  for (const row of rows) {
    if (!winners.has(row.normalized)) continue
    if (ordered.includes(row.normalized)) continue
    ordered.push(row.normalized)
  }
  return ordered
}

function gallerySourceDedupeKeys(
  url: string,
  dispositionName?: string | null,
): string[] {
  const keys = new Set<string>()
  const ut = url.match(UPLOADTHING_FILE_ID)
  if (ut?.[1]) keys.add(`ut:${ut[1].toLowerCase()}`)

  const names = [dispositionName, url.split('?')[0]?.split('/').pop()]
  for (const name of names) {
    if (!name) continue
    const decoded = decodeURIComponent(name).toLowerCase()
    const stripped = decoded.replace(SHOPIFY_UUID_SUFFIX, '')
    keys.add(`file:${stripped}`)
    const loose = stripped.replace(
      /_([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i,
      '',
    )
    if (loose !== stripped) keys.add(`file:${loose}`)
  }

  if (keys.size === 0) keys.add(`url:${url.toLowerCase()}`)
  return [...keys]
}

function gallerySourcePreferenceScore(url: string, isVideo: boolean): number {
  let score = 0
  if (/pba9mjnbca\.ufs\.sh|\.ufs\.sh\//i.test(url)) score += 40
  if (/cdn\.shopify\.com\/.*\/videos\//i.test(url)) score += 35
  if (/\.(mp4)(\?|$)/i.test(url)) score += 30
  if (/\.(webm)(\?|$)/i.test(url)) score += 20
  if (/\.(mov)(\?|$)/i.test(url)) score -= 10
  if (SHOPIFY_UUID_SUFFIX.test(url.split('?')[0] || '')) score -= 15
  if (isVideo) score += 5
  if (/\/files\/23U54rrg34KJ/i.test(url) && /cdn\.shopify\.com/i.test(url)) {
    score -= 5
  }
  return score
}

async function peekRemoteFilename(url: string): Promise<string | null> {
  if (!/^https?:\/\//i.test(url)) return null
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
    })
    clearTimeout(timer)
    const disposition = response.headers.get('content-disposition') || ''
    const match =
      /filename\*=UTF-8''([^;]+)|filename="([^"]+)"|filename=([^;]+)/i.exec(
        disposition,
      )
    const raw = match?.[1] || match?.[2] || match?.[3]
    return raw ? decodeURIComponent(raw.trim()) : null
  } catch {
    return null
  }
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
