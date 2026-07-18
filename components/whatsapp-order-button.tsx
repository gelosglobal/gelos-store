'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { CartLineItem } from '@/components/cart-provider'
import { submitWhatsappOrder } from '@/components/use-whatsapp-order-link'
import { useMarketSettings } from '@/components/market-settings-provider'
import { WhatsAppIcon } from '@/components/whatsapp-icon'
import { cn } from '@/lib/utils'

type WhatsAppOrderButtonProps = {
  items: CartLineItem[]
  subtotal: number
  discount: number
  shipping: number
  total: number
  formatPrice: (amount: number) => string
  promoCode?: string
  locationLabel?: string
  className?: string
}

export function WhatsAppOrderButton({
  items,
  subtotal,
  discount,
  shipping,
  total,
  formatPrice,
  promoCode,
  locationLabel,
  className,
}: WhatsAppOrderButtonProps) {
  const [loading, setLoading] = useState(false)
  const { hasWhatsApp, whatsappChatUrl } = useMarketSettings()

  if (items.length === 0 || !hasWhatsApp) return null

  const handleOrder = async () => {
    if (loading) return
    setLoading(true)

    try {
      await submitWhatsappOrder(
        items,
        formatPrice,
        { subtotal, discount, shipping, total },
        { promoCode, locationLabel, chatUrl: whatsappChatUrl() },
      )
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to open WhatsApp order.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleOrder()}
      disabled={loading}
      className={cn(
        'flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#1ebe57] disabled:opacity-70',
        className,
      )}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <WhatsAppIcon className="h-5 w-5" />
      )}
      {loading ? 'Opening WhatsApp…' : 'Order on WhatsApp'}
    </button>
  )
}
