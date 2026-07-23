'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { useLocation } from '@/components/location-provider'
import { isStorefrontChromeHidden } from '@/lib/dentist/portal'
import type { LocationId } from '@/lib/locations'
import { getOrCreateVisitorId } from '@/lib/visitor-id'

const LANDING_STORAGE_KEY = 'gelos:landing-attribution'
/** Keep live analytics, but avoid burning Vercel Edge Requests / Fluid CPU. */
const HEARTBEAT_INTERVAL_MS = 120_000

type LandingAttribution = {
  landingPath: string
  landingReferrer: string
  utmSource: string
  utmMedium: string
  utmCampaign: string
}

function readLandingAttribution(path: string): LandingAttribution {
  try {
    const raw = window.sessionStorage.getItem(LANDING_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as LandingAttribution
      if (parsed?.landingPath) return parsed
    }
  } catch {
    // ignore
  }

  const params = new URLSearchParams(window.location.search)
  const attribution: LandingAttribution = {
    landingPath: path,
    landingReferrer: document.referrer || '',
    utmSource: params.get('utm_source')?.trim() || '',
    utmMedium: params.get('utm_medium')?.trim() || '',
    utmCampaign: params.get('utm_campaign')?.trim() || '',
  }

  try {
    window.sessionStorage.setItem(LANDING_STORAGE_KEY, JSON.stringify(attribution))
  } catch {
    // ignore
  }

  return attribution
}

async function sendHeartbeat(path: string, locationId: LocationId) {
  const visitorId = getOrCreateVisitorId()
  if (!visitorId) return

  const landing = readLandingAttribution(path)

  await fetch('/api/visitors/heartbeat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      visitorId,
      path,
      referrer: document.referrer || undefined,
      landingPath: landing.landingPath,
      landingReferrer: landing.landingReferrer || undefined,
      utmSource: landing.utmSource || undefined,
      utmMedium: landing.utmMedium || undefined,
      utmCampaign: landing.utmCampaign || undefined,
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
      // Don't ping the server while the tab is in the background.
      if (document.visibilityState !== 'visible') return
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
