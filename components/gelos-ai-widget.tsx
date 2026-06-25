'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { isStorefrontChromeHidden } from '@/lib/dentist/portal'

const GELOS_AI_AVATAR = '/gelos/dentist.png'

export function GelosAiWidget() {
  const pathname = usePathname()
  const hideChrome = isStorefrontChromeHidden(pathname)
  const isChatPage = pathname.startsWith('/ai/chat')

  if (hideChrome || isChatPage) return null

  return (
    <div className="pointer-events-none fixed bottom-5 right-4 z-[60] sm:right-6">
      <div className="pointer-events-auto relative">
        <Link
          href="/ai/chat"
          className="relative block h-14 w-14 overflow-hidden rounded-full shadow-xl ring-2 ring-[#84CC16] transition-transform hover:scale-105"
          aria-label="Chat with Gelos wellness expert"
        >
          <Image
            src={GELOS_AI_AVATAR}
            alt="Gelos wellness expert"
            fill
            className="object-contain object-bottom"
            sizes="56px"
          />
        </Link>
        <span className="absolute top-1 right-1 flex h-2.5 w-2.5" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-40 [animation-duration:2s]" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500 ring-1 ring-white" />
        </span>
      </div>
    </div>
  )
}
