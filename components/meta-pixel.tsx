'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { isStorefrontChromeHidden } from '@/lib/dentist/portal'
import { isMetaPixelEnabled, META_PIXEL_ID, trackMetaPageView } from '@/lib/meta-pixel'

function trackPageViewForPath(pathname: string) {
  const path = `${pathname}${window.location.search}`
  trackMetaPageView()
  return path
}

export function MetaPixel() {
  const pathname = usePathname()
  const scriptReady = useRef(false)
  const lastTrackedPath = useRef('')

  useEffect(() => {
    if (
      !isMetaPixelEnabled() ||
      !pathname ||
      isStorefrontChromeHidden(pathname) ||
      !scriptReady.current
    ) {
      return
    }

    const path = `${pathname}${window.location.search}`
    if (lastTrackedPath.current === path) return
    lastTrackedPath.current = trackPageViewForPath(pathname)
  }, [pathname])

  if (!isMetaPixelEnabled() || !META_PIXEL_ID) return null

  return (
    <>
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        onReady={() => {
          scriptReady.current = true
          if (!pathname || isStorefrontChromeHidden(pathname)) return
          const path = `${pathname}${window.location.search}`
          if (lastTrackedPath.current === path) return
          lastTrackedPath.current = trackPageViewForPath(pathname)
        }}
      >
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${META_PIXEL_ID}');
        `}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  )
}
