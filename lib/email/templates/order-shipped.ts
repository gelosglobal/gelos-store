import type { OrderEmailData } from '@/lib/email/order-email-data'
import {
  renderDetailCard,
  renderEmailLayout,
  renderHeroBlock,
  renderPrimaryButton,
  renderSupportFooter,
} from '@/lib/email/templates/shared'

export type OrderShippedEmailInput = {
  trackingNumber: string
  trackingUrl: string
}

export function buildOrderShippedEmail(
  order: OrderEmailData,
  shipment: OrderShippedEmailInput,
) {
  const firstName = order.customerName.split(' ')[0] || order.customerName
  const subject = `Your Gelos order is on the way — ${order.orderNumber}`

  const trackingRows = [
    { label: 'Carrier', value: 'DHL Express' },
    { label: 'Tracking number', value: shipment.trackingNumber },
    ...(order.shippingAddress
      ? [{ label: 'Delivering to', value: order.shippingAddress, multiline: true }]
      : []),
  ]

  const bodyHtml = `
    ${renderHeroBlock({
      title: `It's on the way, ${firstName}!`,
      description:
        'Your order has been handed to DHL Express. Use the tracking number below to follow it to your door.',
      orderNumber: order.orderNumber,
      highlight: `Tracking ${shipment.trackingNumber}`,
    })}

    ${renderDetailCard('Shipment details', trackingRows)}

    ${renderPrimaryButton(shipment.trackingUrl, 'Track with DHL')}

    ${renderSupportFooter()}
  `

  return {
    subject,
    html: renderEmailLayout({
      title: subject,
      preheader: `DHL tracking ${shipment.trackingNumber} for order ${order.orderNumber}`,
      headerEyebrow: 'Your order shipped',
      bodyHtml,
      footerNote:
        'You received this email because you placed an order at Gelos. If this was not you, please contact us.',
    }),
  }
}
