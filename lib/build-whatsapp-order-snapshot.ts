import type { CartLineItem } from '@/components/cart-provider'
import { getProductHref } from '@/lib/product-utils'
import { getAbsoluteAssetUrl } from '@/lib/storefront-url'
import type { WhatsappOrderSnapshot } from '@/lib/whatsapp-order-types'
import type { WhatsAppOrderCustomer } from '@/lib/whatsapp-order'

export function buildWhatsappOrderSnapshot(
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
): WhatsappOrderSnapshot {
  return {
    items: items.map((item) => {
      const productPath = getProductHref({
        id: item.id,
        name: item.productName,
      })

      return {
        productId: item.id,
        name: item.name,
        productName: item.productName,
        quantity: item.quantity,
        unitPriceLabel: formatPrice(item.price),
        lineTotalLabel: formatPrice(item.price * item.quantity),
        image: getAbsoluteAssetUrl(item.image),
        productPath,
      }
    }),
    subtotalLabel: formatPrice(totals.subtotal),
    discountLabel: totals.discount > 0 ? formatPrice(totals.discount) : undefined,
    shippingLabel: totals.shipping > 0 ? formatPrice(totals.shipping) : undefined,
    totalLabel: formatPrice(totals.total),
    promoCode: options?.promoCode,
    locationLabel: options?.locationLabel,
    customer: options?.customer,
  }
}
