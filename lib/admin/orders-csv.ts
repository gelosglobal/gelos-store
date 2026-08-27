import type { StoreOrder } from '@/lib/types/order'

const ORDER_CSV_HEADERS = [
  'Order',
  'Date',
  'Customer',
  'Market',
  'Destination',
  'Total',
  'Currency',
  'Payment status',
  'Fulfillment status',
  'Items',
  'Channel',
  'Delivery method',
] as const

function escapeCsvValue(value: string | number): string {
  const text = String(value ?? '')
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

function orderToCsvRow(order: StoreOrder): string {
  return [
    order.orderNumber,
    order.dateLabel || order.date,
    order.customer,
    order.marketLabel,
    order.destinationCountry ?? '',
    order.total.toFixed(2),
    order.currency,
    order.paymentStatus,
    order.fulfillmentStatus,
    order.items,
    order.channel,
    order.deliveryMethod,
  ]
    .map(escapeCsvValue)
    .join(',')
}

export function downloadOrdersCsv(orders: StoreOrder[], filename: string) {
  const csv = `\uFEFF${[ORDER_CSV_HEADERS.join(','), ...orders.map(orderToCsvRow)].join('\n')}\n`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
