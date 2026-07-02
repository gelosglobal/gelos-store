import { getAppUrl } from '@/lib/env'

export function getStorefrontAbsoluteUrl(path: string): string {
  const base =
    (typeof window !== 'undefined' ? window.location.origin : null) ||
    getAppUrl()

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${base.replace(/\/$/, '')}${normalizedPath}`
}

export function getAbsoluteAssetUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  return getStorefrontAbsoluteUrl(path)
}
