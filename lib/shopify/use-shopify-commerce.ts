'use client'

import { useEffect, useState } from 'react'

type ShopifyStatus = {
  configured: boolean
  enabled: boolean
  domain: string | null
  mode: 'shopify' | 'legacy'
}

export function useShopifyCommerce() {
  const [status, setStatus] = useState<ShopifyStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    void fetch('/api/shopify/status', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) return null
        return (await res.json()) as ShopifyStatus
      })
      .then((data) => {
        if (!cancelled) setStatus(data)
      })
      .catch(() => {
        if (!cancelled) setStatus(null)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return {
    isLoading,
    enabled: Boolean(status?.enabled),
    domain: status?.domain ?? null,
  }
}

import { countryCodeFromLocation } from '@/lib/shipping-destination'

export function shopifyCountryCodeFromLocation(
  locationId: string,
): string | undefined {
  return countryCodeFromLocation(locationId)
}
