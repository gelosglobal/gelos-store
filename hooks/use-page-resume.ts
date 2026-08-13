'use client'

import { useEffect } from 'react'

function isBackForwardNavigation(): boolean {
  if (typeof performance === 'undefined') return false
  const nav = performance.getEntriesByType(
    'navigation',
  )[0] as PerformanceNavigationTiming | undefined
  return nav?.type === 'back_forward'
}

/**
 * Fires when the shopper returns via browser Back (bfcache or reload).
 * Shopify Checkout is a full document navigation, so React state can come
 * back frozen (e.g. "Redirecting to checkout…").
 */
export function usePageResume(onResume: () => void) {
  useEffect(() => {
    if (isBackForwardNavigation()) {
      onResume()
    }

    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted || isBackForwardNavigation()) {
        onResume()
      }
    }

    window.addEventListener('pageshow', onPageShow)
    return () => window.removeEventListener('pageshow', onPageShow)
  }, [onResume])
}
