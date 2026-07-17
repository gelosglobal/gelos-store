'use client'

import { useMemo } from 'react'
import type { CartLineItem } from '@/components/cart-provider'
import { useCart } from '@/components/cart-provider'
import { useLocation } from '@/components/location-provider'
import { useStorePromotions } from '@/components/store-promotions-provider'
import { buildWhatsappOrderSnapshot } from '@/lib/build-whatsapp-order-snapshot'
import { calculateCheckoutTotals } from '@/lib/checkout'
import { hasSmileRewardFreeShipping } from '@/lib/gelos-ai/smile-reward-storage'
import { getProductHref } from '@/lib/product-utils'
import { getAbsoluteAssetUrl, getStorefrontAbsoluteUrl } from '@/lib/storefront-url'
import {
  buildWhatsAppOrderMessage,
  getWhatsAppOrderUrl,
  openWhatsAppOrderUrl,
  type WhatsAppOrderCustomer,
  type WhatsAppOrderLine,
} from '@/lib/whatsapp-order'
import { getWhatsAppChatUrl } from '@/lib/whatsapp'

export function useWhatsAppOrderLink(customer?: WhatsAppOrderCustomer) {
  const { items, isHydrated } = useCart()
  const { formatPrice, location } = useLocation()
  const { appliedPromoCode, promotions } = useStorePromotions()

  const totals = useMemo(() => {
    if (!isHydrated || items.length === 0) return null
    return calculateCheckoutTotals(items, {
      promoCode: appliedPromoCode,
      promotions,
      smileRewardFreeShipping: hasSmileRewardFreeShipping(),
    })
  }, [appliedPromoCode, isHydrated, items, promotions])

  return useMemo(() => {
    const generalHref = getWhatsAppChatUrl()
    const hasItems = isHydrated && items.length > 0

    if (!hasItems || !totals) {
      return {
        href: generalHref,
        hasOrder: false,
        label: 'Chat on WhatsApp',
        ariaLabel: 'Chat with Gelos on WhatsApp',
        items: [] as CartLineItem[],
        totals: null,
        formatPrice,
        locationLabel: location.label,
        promoCode: undefined as string | undefined,
      }
    }

    return {
      href: generalHref,
      hasOrder: true,
      label: 'Order on WhatsApp',
      ariaLabel: 'Place your Gelos order on WhatsApp',
      items,
      totals,
      formatPrice,
      locationLabel: location.label,
      promoCode: appliedPromoCode || undefined,
      customer,
    }
  }, [
    appliedPromoCode,
    customer,
    formatPrice,
    isHydrated,
    items,
    location.label,
    totals,
  ])
}

function toOrderLine(
  item: CartLineItem,
  formatPrice: (amount: number) => string,
): WhatsAppOrderLine {
  const productPath = getProductHref({
    id: item.id,
    name: item.productName,
  })

  return {
    name: item.name,
    quantity: item.quantity,
    unitPriceLabel: formatPrice(item.price),
    lineTotalLabel: formatPrice(item.price * item.quantity),
    imageUrl: getAbsoluteAssetUrl(item.image),
    productUrl: getStorefrontAbsoluteUrl(productPath),
  }
}

export async function submitWhatsappOrder(
  items: CartLineItem[],
  formatPrice: (amount: number) => string,
  totals: {
    subtotal: number
    discount: number
    shipping: number
    total: number
  },
  options?: {
    promoCode?: string
    locationLabel?: string
    customer?: WhatsAppOrderCustomer
  },
) {
  const snapshot = buildWhatsappOrderSnapshot(items, formatPrice, totals, options)

  const response = await fetch('/api/store/whatsapp-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(snapshot),
  })

  const data = (await response.json()) as {
    shareUrl?: string
    error?: string
  }

  if (!response.ok || !data.shareUrl) {
    throw new Error(data.error ?? 'Failed to create WhatsApp order link.')
  }

  const message = buildWhatsAppOrderMessage({
    lines: items.map((item) => toOrderLine(item, formatPrice)),
    subtotalLabel: snapshot.subtotalLabel,
    discountLabel: snapshot.discountLabel,
    shippingLabel: snapshot.shippingLabel,
    totalLabel: snapshot.totalLabel,
    promoCode: options?.promoCode,
    locationLabel: options?.locationLabel,
    customer: options?.customer,
    shareUrl: data.shareUrl,
  })

  openWhatsAppOrderUrl(message)
}

export function buildWhatsAppOrderLinkFromCart(
  items: CartLineItem[],
  formatPrice: (amount: number) => string,
  totals: {
    subtotal: number
    discount: number
    shipping: number
    total: number
  },
  options?: {
    promoCode?: string
    locationLabel?: string
    customer?: WhatsAppOrderCustomer
    shareUrl?: string
  },
) {
  const message = buildWhatsAppOrderMessage({
    lines: items.map((item) => toOrderLine(item, formatPrice)),
    subtotalLabel: formatPrice(totals.subtotal),
    discountLabel: totals.discount > 0 ? formatPrice(totals.discount) : undefined,
    shippingLabel: totals.shipping > 0 ? formatPrice(totals.shipping) : undefined,
    totalLabel: formatPrice(totals.total),
    promoCode: options?.promoCode,
    locationLabel: options?.locationLabel,
    customer: options?.customer,
    shareUrl: options?.shareUrl,
  })

  return getWhatsAppOrderUrl(message)
}
