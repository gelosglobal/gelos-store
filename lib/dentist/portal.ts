export function isDentistPortalPath(pathname: string | null | undefined): boolean {
  return Boolean(pathname?.startsWith('/dentist'))
}

export function isStorefrontChromeHidden(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  return pathname.startsWith('/admin') || isDentistPortalPath(pathname)
}
