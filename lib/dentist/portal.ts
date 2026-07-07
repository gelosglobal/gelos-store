export function isDentistPortalPath(pathname: string | null | undefined): boolean {
  return Boolean(pathname?.startsWith('/dentist'))
}

export function isAffiliatePortalPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  return (
    pathname === '/affiliate' ||
    pathname.startsWith('/affiliate/login') ||
    pathname.startsWith('/affiliate/signup') ||
    pathname.startsWith('/affiliate/dashboard')
  )
}

export function isStorefrontChromeHidden(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  return (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/whatsapp-order') ||
    isDentistPortalPath(pathname) ||
    isAffiliatePortalPath(pathname)
  )
}
