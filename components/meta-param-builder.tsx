'use client'

import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useRef } from 'react'
import { isStorefrontChromeHidden } from '@/lib/dentist/portal'
import { isMetaPixelEnabled } from '@/lib/meta-pixel'

declare global {
  interface Window {
    clientParamBuilder?: {
      processAndCollectAllParams: (
        url?: string | null,
        getIpFn?: () => string | Promise<string>,
      ) => Promise<Record<string, string>> | Record<string, string>
      getFbc: () => string
      getFbp: () => string
      getClientIpAddress: () => string
    }
  }
}

/**
 * Meta ParamBuilder (client-side) — improves fbp/fbc cookie quality for CAPI.
 * Docs: https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameter-builder-library
 *
 * Our server CAPI already reads `_fbp` / `_fbc` from cookies; this ensures those
 * cookies are created early (including from `fbclid` on landing URLs).
 */
function MetaParamBuilderInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const ready = useRef(false)

  const collect = useCallback(async () => {
    if (!isMetaPixelEnabled() || !pathname || isStorefrontChromeHidden(pathname)) {
      return
    }

    const builder = window.clientParamBuilder
    if (!builder?.processAndCollectAllParams) return

    const search = searchParams?.toString()
    const url = `${window.location.origin}${pathname}${search ? `?${search}` : ''}`

    const getIpFn = async () => {
      try {
        const res = await fetch('/api/visitors/client-ip', { cache: 'no-store' })
        if (!res.ok) return ''
        const data = (await res.json()) as { ip?: string }
        return data.ip?.trim() || ''
      } catch {
        return ''
      }
    }

    try {
      await builder.processAndCollectAllParams(url, getIpFn)
    } catch {
      // ParamBuilder must never break the storefront.
    }
  }, [pathname, searchParams])

  useEffect(() => {
    if (!ready.current) return
    void collect()
  }, [collect])

  if (!isMetaPixelEnabled()) return null

  return (
    <Script
      id="meta-param-builder"
      src="https://unpkg.com/meta-capi-param-builder-clientjs/dist/clientParamBuilder.bundle.js"
      strategy="afterInteractive"
      onLoad={() => {
        ready.current = true
        void collect()
      }}
    />
  )
}

export function MetaParamBuilder() {
  return (
    <Suspense fallback={null}>
      <MetaParamBuilderInner />
    </Suspense>
  )
}
