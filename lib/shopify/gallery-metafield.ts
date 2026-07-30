import { encodeGalleryVideo } from '@/lib/product-gallery-images'

/** Default Shopify product metafield for the PDP feature gallery (Image 2). */
export const SHOPIFY_GALLERY_METAFIELD_NAMESPACE =
  process.env.SHOPIFY_GALLERY_METAFIELD_NAMESPACE?.trim() || 'custom'

export const SHOPIFY_GALLERY_METAFIELD_KEY =
  process.env.SHOPIFY_GALLERY_METAFIELD_KEY?.trim() || 'gallery'

/**
 * GraphQL fragment fields for `custom.gallery` (or env override).
 * Supports list.file_reference, file_reference, json, and multi-line text URLs.
 */
export const SHOPIFY_GALLERY_METAFIELD_SELECTION = /* GraphQL */ `
  gallery: metafield(namespace: "${SHOPIFY_GALLERY_METAFIELD_NAMESPACE}", key: "${SHOPIFY_GALLERY_METAFIELD_KEY}") {
    type
    value
    reference {
      ... on MediaImage {
        image {
          url
        }
      }
      ... on Video {
        sources {
          url
          mimeType
        }
      }
      ... on GenericFile {
        url
      }
    }
    references(first: 20) {
      nodes {
        ... on MediaImage {
          image {
            url
          }
        }
        ... on Video {
          sources {
            url
            mimeType
          }
        }
        ... on GenericFile {
          url
        }
      }
    }
  }
`

export type ShopifyGalleryMetafield = {
  type?: string | null
  value?: string | null
  reference?: ShopifyGalleryReference | null
  references?: {
    nodes: Array<ShopifyGalleryReference | null>
  } | null
}

type ShopifyGalleryReference = {
  image?: { url?: string | null } | null
  sources?: Array<{ url?: string | null; mimeType?: string | null }> | null
  url?: string | null
  mimeType?: string | null
}

function isVideoUrl(url: string, mimeType?: string | null): boolean {
  if (mimeType?.toLowerCase().startsWith('video/')) return true
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url)
}

function toGalleryEntry(url: string, mimeType?: string | null): string | null {
  const trimmed = url.trim()
  if (!trimmed) return null
  if (isVideoUrl(trimmed, mimeType)) return encodeGalleryVideo(trimmed)
  return trimmed
}

function entryFromReference(ref: ShopifyGalleryReference | null | undefined): string | null {
  if (!ref) return null

  if (ref.image?.url) {
    return toGalleryEntry(ref.image.url)
  }

  if (ref.sources?.length) {
    const preferred =
      ref.sources.find((source) =>
        source.mimeType?.toLowerCase().includes('mp4'),
      ) ?? ref.sources[0]
    if (preferred?.url) {
      return toGalleryEntry(preferred.url, preferred.mimeType)
    }
  }

  if (ref.url) {
    return toGalleryEntry(ref.url, ref.mimeType)
  }

  return null
}

function entriesFromJsonOrText(value: string): string[] {
  const trimmed = value.trim()
  if (!trimmed) return []

  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed) as unknown
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => {
            if (typeof item === 'string') return toGalleryEntry(item)
            if (item && typeof item === 'object') {
              const record = item as { url?: string; type?: string }
              if (!record.url) return null
              if (record.type === 'video') return encodeGalleryVideo(record.url)
              return toGalleryEntry(record.url)
            }
            return null
          })
          .filter((entry): entry is string => Boolean(entry))
      }
    } catch {
      // fall through to line parsing
    }
  }

  return trimmed
    .split(/\r?\n|,/)
    .map((line) => toGalleryEntry(line.trim()))
    .filter((entry): entry is string => Boolean(entry))
}

/**
 * Convert a Shopify `custom.gallery` metafield into Gelos galleryImages entries
 * (`url` or `video:url`).
 */
export function galleryImagesFromShopifyMetafield(
  metafield: ShopifyGalleryMetafield | null | undefined,
): string[] {
  if (!metafield) return []

  const fromRefs: string[] = []

  if (metafield.references?.nodes?.length) {
    for (const node of metafield.references.nodes) {
      const entry = entryFromReference(node)
      if (entry) fromRefs.push(entry)
    }
  } else if (metafield.reference) {
    const entry = entryFromReference(metafield.reference)
    if (entry) fromRefs.push(entry)
  }

  if (fromRefs.length > 0) return fromRefs

  if (metafield.value?.trim()) {
    // list.file_reference stores GIDs in `value` — skip those if refs were empty.
    if (/^\[?\s*"gid:\/\//i.test(metafield.value.trim())) return []
    return entriesFromJsonOrText(metafield.value)
  }

  return []
}
