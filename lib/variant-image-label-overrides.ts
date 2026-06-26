import { normalizeImageUrl } from '@/lib/image-url'

/**
 * Labels for admin-uploaded variant images whose URLs use opaque file keys
 * (UploadThing / ufs.sh) instead of descriptive filenames.
 */
const VARIANT_LABEL_BY_IMAGE_URL: Record<string, string> = {
  '/gelos/bb.brushbl.png': 'Bamboo',
  'https://pba9mjnbca.ufs.sh/f/23U54rrg34KJY2sILlBed7qIHvBlmTYk9MZyfScgW3jhuO5P':
    'Watermelon Mint',
  'https://pba9mjnbca.ufs.sh/f/23U54rrg34KJiwMYP6C69TFUd43lzgsGHCQMkXIVbaJcoERW':
    'Mango Mint',
  'https://pba9mjnbca.ufs.sh/f/23U54rrg34KJS9GSLn7Jv4K0MTfRVb9CHzPEjyduaXxklDUt':
    'Cool Mint',
}

const VARIANT_LABEL_BY_FILE_KEY: Record<string, string> = Object.fromEntries(
  Object.entries(VARIANT_LABEL_BY_IMAGE_URL).map(([url, label]) => [
    url.split('/').pop() ?? url,
    label,
  ]),
)

function titleCase(value: string): string {
  return value.replace(/\b\w/g, (char) => char.toUpperCase())
}

/** True when a URL path segment is an UploadThing-style opaque key, not a readable filename. */
export function isOpaqueUploadFileKey(segment: string): boolean {
  const base = decodeURIComponent(segment)
    .replace(/\.(png|jpe?g|webp|gif|avif)$/i, '')
    .trim()

  if (!base) return true
  if (/^IMG_\d+(_[0-9a-f-]+)?$/i.test(base)) return true

  // e.g. 23U54rrg34KJY2sILlBed7qIHvBlmTYk9MZyfScgW3jhuO5P
  if (/^[A-Za-z0-9]{20,}$/.test(base) && !base.includes('-') && !base.includes('_')) {
    return true
  }

  return false
}

/** Parse a human label from descriptive upload filenames (when present in the URL). */
export function parseDescriptiveUploadFilename(filename: string): string | undefined {
  let base = decodeURIComponent(filename)
    .replace(/\.(png|jpe?g|webp|gif|avif)$/i, '')
    .trim()

  base = base
    .replace(/_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, '')
    .replace(/-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, '')

  if (!base || /^IMG_\d+$/i.test(base)) return undefined

  const label = base
    .replace(/-accurate$/i, '')
    .replace(/-inhaler$/i, '')
    .replace(/-/g, ' ')
    .trim()

  if (!label || label.length < 3) return undefined
  return titleCase(label)
}

export function getKnownVariantLabelFromImageUrl(imageUrl: string): string | undefined {
  const normalized = normalizeImageUrl(imageUrl)
  const direct = VARIANT_LABEL_BY_IMAGE_URL[normalized]
  if (direct) return direct

  const fileKey = normalized.split('/').pop() ?? ''
  const byKey = VARIANT_LABEL_BY_FILE_KEY[fileKey]
  if (byKey) return byKey

  return undefined
}
