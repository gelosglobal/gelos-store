'use client'

import { usePathname } from 'next/navigation'
import { SiteFooter } from '@/components/site-footer'

const FOOTER_EXCLUDED_PREFIXES = ['/admin', '/dentist']

export function SiteFooterShell() {
  const pathname = usePathname()
  const hideFooter = FOOTER_EXCLUDED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )

  if (hideFooter) return null

  return <SiteFooter />
}
