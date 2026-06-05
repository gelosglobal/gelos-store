import { getAppUrl } from '@/lib/env'
import type { OrderEmailData } from '@/lib/email/order-email-data'
import {
  escapeHtml,
  formatMoney,
  renderDetailCard,
  renderEmailLayout,
  renderHeroBlock,
  renderLineItemsCard,
  renderOrderTotalsCard,
  renderPrimaryButton,
  renderSectionTitle,
  renderStatusPills,
  renderSupportFooter,
} from '@/lib/email/templates/shared'

function paymentHighlight(order: OrderEmailData): string {
  if (order.paymentStatus === 'Paid') {
    return 'Your payment went through successfully. We are getting your order ready now.'
  }
  if (order.channel === 'Cash on delivery') {
    return 'Please have your payment ready at delivery. We will reach out if we need any extra details.'
  }
  return 'We will send another update as soon as your payment is confirmed.'
}

export function buildOrderConfirmationEmail(order: OrderEmailData) {
  const appUrl = getAppUrl()
  const firstName = order.customerName.split(' ')[0] || order.customerName
  const subject = `Your Gelos order is confirmed — ${order.orderNumber}`

  const detailRows = [
    ...(order.shippingAddress
      ? [{ label: 'Delivery address', value: order.shippingAddress, multiline: true }]
      : []),
    ...(order.customerPhone
      ? [{ label: 'Phone', value: order.customerPhone }]
      : []),
  ]

  const bodyHtml = `
    ${renderHeroBlock({
      title: `Thanks, ${firstName}!`,
      description: `Your order is confirmed and our team has been notified. Here is everything you need to know.`,
      orderNumber: order.orderNumber,
      highlight: paymentHighlight(order),
    })}

    ${renderStatusPills(order.paymentStatus, order.channel)}

    ${renderDetailCard('Delivery details', detailRows)}

    ${renderSectionTitle('Order summary')}
    ${renderLineItemsCard(order.items, order.currency)}
    ${renderOrderTotalsCard(
      order.currency,
      order.subtotal,
      order.discount,
      order.shipping,
      order.total,
    )}

    ${renderPrimaryButton(`${appUrl}/checkout/success`, 'Track your order')}

    ${renderSupportFooter()}
  `

  return {
    subject,
    html: renderEmailLayout({
      title: subject,
      preheader: `Order ${order.orderNumber} confirmed · ${formatMoney(order.currency, order.total)} total`,
      headerEyebrow: 'Order confirmation',
      bodyHtml,
      footerNote:
        'You received this email because you placed an order at Gelos. If this was not you, please contact us.',
    }),
  }
}
