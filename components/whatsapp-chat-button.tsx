'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  submitWhatsappOrder,
  useWhatsAppOrderLink,
} from '@/components/use-whatsapp-order-link'
import { WhatsAppIcon } from '@/components/whatsapp-icon'
import { cn } from '@/lib/utils'

export function WhatsAppChatButton() {
  const order = useWhatsAppOrderLink()
  const [labelVisible, setLabelVisible] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!order.href) return null

  const triggerClassName = cn(
    'group flex items-center justify-end gap-3 outline-none',
    'focus-visible:rounded-full focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2',
  )

  const handleOrder = async () => {
    if (!order.totals || loading) return
    setLoading(true)

    try {
      await submitWhatsappOrder(
        order.items,
        order.formatPrice,
        order.totals,
        {
          promoCode: order.promoCode,
          locationLabel: order.locationLabel,
        },
      )
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to open WhatsApp order.',
      )
    } finally {
      setLoading(false)
    }
  }

  const bubble = (
    <>
      <span
        className={cn(
          'max-w-[12rem] rounded-full bg-white px-4 py-2 text-sm font-semibold text-neutral-900 shadow-lg ring-1 ring-neutral-200 transition-all duration-200',
          labelVisible
            ? 'translate-x-0 opacity-100'
            : 'pointer-events-none translate-x-2 opacity-0 sm:group-hover:translate-x-0 sm:group-hover:opacity-100 sm:group-focus-visible:translate-x-0 sm:group-focus-visible:opacity-100',
        )}
      >
        {order.label}
      </span>

      <span
        className={cn(
          'flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl',
          'transition-transform hover:scale-105 active:scale-95',
          loading && 'scale-100',
        )}
      >
        {loading ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          <WhatsAppIcon className="h-7 w-7" />
        )}
      </span>
    </>
  )

  return (
    <div
      id="gelos-whatsapp-dock"
      className="pointer-events-none fixed bottom-5 right-4 z-[60] sm:right-6"
    >
      <div
        className="pointer-events-auto relative"
        onMouseEnter={() => setLabelVisible(true)}
        onMouseLeave={() => setLabelVisible(false)}
        onFocus={() => setLabelVisible(true)}
        onBlur={() => setLabelVisible(false)}
      >
        {order.hasOrder && order.totals ? (
          <button
            type="button"
            onClick={() => void handleOrder()}
            disabled={loading}
            className={triggerClassName}
            aria-label={order.ariaLabel}
          >
            {bubble}
          </button>
        ) : (
          <a
            href={order.href}
            target="_blank"
            rel="noopener noreferrer"
            className={triggerClassName}
            aria-label={order.ariaLabel}
          >
            {bubble}
          </a>
        )}
      </div>
    </div>
  )
}
