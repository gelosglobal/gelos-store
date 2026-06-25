'use client'

import Script from 'next/script'

const ELFSIGHT_APP_ID = 'elfsight-app-18836ad6-59d0-437c-9b8d-177ab345d7ed'

export function ElfsightStoreLocator({ className }: { className?: string }) {
  return (
    <>
      <Script src="https://elfsightcdn.com/platform.js" strategy="lazyOnload" />
      <div className={className}>
        <div className={ELFSIGHT_APP_ID} data-elfsight-app-lazy />
      </div>
    </>
  )
}
