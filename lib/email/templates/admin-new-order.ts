import { getAppUrl } from '@/lib/env'
import type { OrderEmailData } from '@/lib/email/order-email-data'
import {
  formatMoney,
  renderDetailCard,
  renderEmailLayout,
  renderHeroBlock,
  renderLineItemsCard,
  renderOrderTotalsCard,
  renderPrimaryButton,
  renderSectionTitle,
  renderStatusPills,
} from '@/lib/email/templates/shared'

export function buildAdminNewOrderEmail(order: OrderEmailData) {
  const appUrl = getAppUrl()
  const subject = `New order · ${order.orderNumber} · ${formatMoney(order.currency, order.total)}`

  const customerRows = [
    { label: 'Customer', value: order.customerName },
    { label: 'Email', value: order.customerEmail },
    ...(order.customerPhone ? [{ label: 'Phone', value: order.customerPhone }] : []),
    ...(order.shippingAddress
      ? [{ label: 'Delivery address', value: order.shippingAddress, multiline: true }]
      : []),
  ]

  const bodyHtml = `
    ${renderHeroBlock({
      title: 'You have a new order',
      description: `${order.customerName} just checked out on the storefront. Review the details below and fulfill when ready.`,
      orderNumber: order.orderNumber,
      highlight: `Order total: ${formatMoney(order.currency, order.total)}`,
    })}

    ${renderStatusPills(order.paymentStatus, order.channel)}

    ${renderDetailCard('Customer details', customerRows)}

    ${renderSectionTitle('Items ordered')}
    ${renderLineItemsCard(order.items, order.currency)}
    ${renderOrderTotalsCard(
      order.currency,
      order.subtotal,
      order.discount,
      order.shipping,
      order.total,
    )}

    ${renderPrimaryButton(`${appUrl}/admin/orders`, 'Fulfill in admin')}
  `

  return {
    subject,
    html: renderEmailLayout({
      title: subject,
      preheader: `${order.customerName} placed order ${order.orderNumber} for ${formatMoney(order.currency, order.total)}`,
      headerEyebrow: 'New order alert',
      bodyHtml,
    }),
  }
}
