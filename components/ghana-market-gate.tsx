'use client'

import { useRouter } from 'next/navigation'
import { useEffect, type ReactNode } from 'react'
import { useLocation } from '@/components/location-provider'

export function GhanaMarketGate({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { locationId, isHydrated } = useLocation()
  const allowed = locationId === 'ghana'

  useEffect(() => {
    if (!isHydrated) return
    if (!allowed) router.replace('/')
  }, [allowed, isHydrated, router])

  if (!isHydrated || !allowed) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center bg-white text-sm text-neutral-500">
        {isHydrated ? 'This page is available in Ghana only.' : 'Loading…'}
      </div>
    )
  }

  return children
}
