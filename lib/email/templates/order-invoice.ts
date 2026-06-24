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

function invoiceHighlight(order: OrderEmailData): string {
  if (order.paymentStatus === 'Paid') {
    return 'This invoice is for your records. Payment for this order has already been received.'
  }
  if (order.channel === 'Cash on delivery') {
    return `Please have ${formatMoney(order.currency, order.total)} ready at delivery. This invoice confirms the amount due for order ${order.orderNumber}.`
  }
  return `Payment of ${formatMoney(order.currency, order.total)} is due for this order. Use the button below to complete checkout or contact us if you need help.`
}

export function buildOrderInvoiceEmail(order: OrderEmailData) {
  const appUrl = getAppUrl()
  const firstName = order.customerName.split(' ')[0] || order.customerName
  const subject = `Invoice for Gelos order ${order.orderNumber}`

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
      title: `Hi ${firstName}, here is your invoice`,
      description: `This is a summary of order ${order.orderNumber}. Review the details below and complete payment if a balance is still outstanding.`,
      orderNumber: order.orderNumber,
      highlight: invoiceHighlight(order),
    })}

    ${renderStatusPills(order.paymentStatus, order.channel)}

    ${renderDetailCard('Delivery details', detailRows)}

    ${renderSectionTitle('Invoice summary')}
    ${renderLineItemsCard(order.items, order.currency)}
    ${renderOrderTotalsCard(
      order.currency,
      order.subtotal,
      order.discount,
      order.shipping,
      order.total,
    )}

    ${
      order.paymentStatus !== 'Paid'
        ? renderPrimaryButton(`${appUrl}/checkout`, 'Complete payment')
        : renderPrimaryButton(`${appUrl}`, 'Visit Gelos')
    }

    ${renderSupportFooter()}
  `

  return {
    subject,
    html: renderEmailLayout({
      title: subject,
      preheader: `Invoice ${order.orderNumber} · ${formatMoney(order.currency, order.total)} due`,
      headerEyebrow: 'Order invoice',
      bodyHtml,
      footerNote:
        'You received this email because an invoice was sent for your Gelos order. If this was not expected, please contact us.',
    }),
  }
}
