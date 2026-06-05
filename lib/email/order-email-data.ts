import type { CheckoutLineItem } from '@/lib/checkout'

export type OrderEmailData = {
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  shippingAddress?: string
  items: CheckoutLineItem[]
  subtotal: number
  shipping: number
  discount: number
  total: number
  currency: string
  paymentStatus: string
  channel: string
}
