import type { CheckoutLineItem } from '@/lib/checkout'
import type { AdminOrderDetail } from '@/lib/types/order'

export type OrderEmailData = {
  orderId?: string
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

export function adminOrderToEmailData(order: AdminOrderDetail): OrderEmailData {
  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customer,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    shippingAddress: order.shippingAddress,
    items: order.lineItems.map(
      (item): CheckoutLineItem => ({
        id: item.id,
        name: item.name,
        productName: item.productName,
        price: item.price,
        quantity: item.quantity,
        variantLabel: item.variantLabel,
        variantImage: item.variantImage,
      }),
    ),
    subtotal: order.subtotal,
    shipping: order.shipping,
    discount: order.discount,
    total: order.total,
    currency: order.currency,
    paymentStatus: order.paymentStatus,
    channel: order.channel,
  }
}
