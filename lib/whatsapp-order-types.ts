import type { WhatsAppOrderCustomer } from '@/lib/whatsapp-order'

export type WhatsappOrderItem = {
  productId: string
  name: string
  productName: string
  quantity: number
  unitPriceLabel: string
  lineTotalLabel: string
  image: string
  productPath: string
}

export type WhatsappOrderSnapshot = {
  items: WhatsappOrderItem[]
  subtotalLabel: string
  discountLabel?: string
  shippingLabel?: string
  totalLabel: string
  promoCode?: string
  locationLabel?: string
  customer?: WhatsAppOrderCustomer
}

export function getWhatsappOrderSharePath(orderId: string): string {
  return `/whatsapp-order/${orderId}`
}
