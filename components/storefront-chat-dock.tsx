'use client'

import Image from 'next/image'
import Link from 'next/link'
import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { isStorefrontChromeHidden } from '@/lib/dentist/portal'
import { cn } from '@/lib/utils'

const GELOS_AI_AVATAR = '/gelos/dentist.png'
const ELFSIGHT_WHATSAPP_APP_ID = 'elfsight-app-9b3ba36b-6e34-46ac-bcfd-a31a30d03004'

export function StorefrontChatDock() {
  const pathname = usePathname()
  const hideChrome = isStorefrontChromeHidden(pathname)
  const isChatPage = pathname.startsWith('/ai/chat')

  if (hideChrome) return null

  return (
    <>
      <Script src="https://elfsightcdn.com/platform.js" strategy="lazyOnload" />

      {/* Gelos AI — fixed bottom-left */}
      {!isChatPage ? (
        <div
          id="gelos-ai-dock"
          className="pointer-events-none fixed bottom-5 left-4 z-[60] sm:left-6"
        >
          <div className="pointer-events-auto relative">
            <Link
              href="/ai/chat"
              className={cn(
                'relative block h-14 w-14 overflow-hidden rounded-full bg-[#84CC16] shadow-xl',
                'ring-2 ring-[#84CC16] transition-transform hover:scale-105',
              )}
              aria-label="Chat with Gelos wellness expert"
            >
              <Image
                src={GELOS_AI_AVATAR}
                alt="Gelos wellness expert"
                fill
                className="object-cover object-top"
                sizes="56px"
              />
            </Link>
            <span className="absolute top-0.5 right-0.5 flex h-2.5 w-2.5" aria-hidden>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
            </span>
          </div>
        </div>
      ) : null}

      {/* WhatsApp — Elfsight defaults to bottom-right */}
      <div className={ELFSIGHT_WHATSAPP_APP_ID} data-elfsight-app-lazy />
    </>
  )
}
