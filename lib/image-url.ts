/** True for UploadThing, CDN, or any absolute image URL. */
export function isExternalImageUrl(url: string) {
  return /^https?:\/\//i.test(url.trim())
}

/** Fix URLs corrupted by prepending `/` to absolute UploadThing/CDN links. */
export function repairImageUrl(image: string) {
  const trimmed = image.trim()
  if (trimmed.startsWith('/https:/')) {
    return `https://${trimmed.slice('/https:/'.length)}`
  }
  if (trimmed.startsWith('/http:/')) {
    return `http://${trimmed.slice('/http:/'.length)}`
  }
  return trimmed
}

/** Normalize catalog image paths for DB and Next.js Image. */
export function normalizeImageUrl(image: string) {
  const trimmed = repairImageUrl(image.trim())
  if (!trimmed) return '/placeholder.svg'
  if (isExternalImageUrl(trimmed)) return trimmed
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}
