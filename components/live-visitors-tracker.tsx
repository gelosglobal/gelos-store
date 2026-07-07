'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { useLocation } from '@/components/location-provider'
import { isStorefrontChromeHidden } from '@/lib/dentist/portal'
import type { LocationId } from '@/lib/locations'

const VISITOR_STORAGE_KEY = 'gelos:visitor-id'
const HEARTBEAT_INTERVAL_MS = 30_000

function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return ''

  const existing = window.localStorage.getItem(VISITOR_STORAGE_KEY)?.trim()
  if (existing) return existing

  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `v_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

  window.localStorage.setItem(VISITOR_STORAGE_KEY, id)
  return id
}

async function sendHeartbeat(path: string, locationId: LocationId) {
  const visitorId = getOrCreateVisitorId()
  if (!visitorId) return

  await fetch('/api/visitors/heartbeat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      visitorId,
      path,
      referrer: document.referrer || undefined,
      locationId,
    }),
    keepalive: true,
  }).catch(() => undefined)
}

export function LiveVisitorsTracker() {
  const pathname = usePathname()
  const { locationId } = useLocation()
  const lastPath = useRef('')

  useEffect(() => {
    if (!pathname || isStorefrontChromeHidden(pathname)) return

    const path = `${pathname}${window.location.search}`
    lastPath.current = path

    void sendHeartbeat(path, locationId)

    const interval = window.setInterval(() => {
      void sendHeartbeat(lastPath.current || path, locationId)
    }, HEARTBEAT_INTERVAL_MS)

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void sendHeartbeat(lastPath.current || path, locationId)
      }
    }

    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [pathname, locationId])

  return null
}
