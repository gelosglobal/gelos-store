import type { StoreOrder } from '@/lib/types/order'

export const adminOrders: StoreOrder[] = [
  {
    id: 'ord-4601',
    orderNumber: '#4601G',
    customer: 'Kojo Darko',
    date: '2026-06-03T11:11:00',
    dateLabel: 'Today at 11:11 am',
    total: 640,
    items: 3,
    paymentStatus: 'Payment pending',
    fulfillmentStatus: 'Unfulfilled',
    status: 'Unfulfilled',
    channel: 'Online Store',
    deliveryMethod: 'standard',
    tags: [],
  },
  {
    id: 'ord-4600',
    orderNumber: '#4600G',
    customer: 'Ama Mensah',
    date: '2026-06-03T10:42:00',
    dateLabel: 'Today at 10:42 am',
    total: 168,
    items: 2,
    paymentStatus: 'Paid',
    fulfillmentStatus: 'Unfulfilled',
    status: 'Unfulfilled',
    channel: 'Online Store',
    deliveryMethod: 'standard',
    tags: [],
  },
  {
    id: 'ord-4599',
    orderNumber: '#4599G',
    customer: 'Kwame Asante',
    date: '2026-06-03T09:15:00',
    dateLabel: 'Today at 9:15 am',
    total: 88,
    items: 1,
    paymentStatus: 'Paid',
    fulfillmentStatus: 'Unfulfilled',
    status: 'Unfulfilled',
    channel: 'Online Store',
    deliveryMethod: 'standard',
    tags: [],
  },
  {
    id: 'ord-4598',
    orderNumber: '#4598G',
    customer: 'Efua Boateng',
    date: '2026-06-02T16:30:00',
    dateLabel: 'Yesterday at 4:30 pm',
    total: 240,
    items: 3,
    paymentStatus: 'Paid',
    fulfillmentStatus: 'Unfulfilled',
    status: 'Unfulfilled',
    channel: 'Online Store',
    deliveryMethod: 'standard',
    tags: [],
  },
  {
    id: 'ord-4597',
    orderNumber: '#4597G',
    customer: 'Yaa Osei',
    date: '2026-06-02T14:05:00',
    dateLabel: 'Yesterday at 2:05 pm',
    total: 160,
    items: 2,
    paymentStatus: 'Paid',
    fulfillmentStatus: 'Unfulfilled',
    status: 'Unfulfilled',
    channel: 'Online Store',
    deliveryMethod: 'standard',
    tags: [],
  },
  {
    id: 'ord-4596',
    orderNumber: '#4596G',
    customer: 'Nana Adjei',
    date: '2026-06-02T11:20:00',
    dateLabel: 'Yesterday at 11:20 am',
    total: 80,
    items: 1,
    paymentStatus: 'Paid',
    fulfillmentStatus: 'Unfulfilled',
    status: 'Unfulfilled',
    channel: 'Online Store',
    deliveryMethod: 'standard',
    tags: [],
  },
  {
    id: 'ord-4595',
    orderNumber: '#4595G',
    customer: 'Sarah Johnson',
    date: '2026-05-28T09:00:00',
    dateLabel: '28 May at 9:00 am',
    total: 248,
    items: 3,
    paymentStatus: 'Paid',
    fulfillmentStatus: 'Delivered',
    status: 'Delivered',
    channel: 'Online Store',
    deliveryMethod: 'standard',
    deliveryStatus: 'Delivered',
    tags: [],
  },
  {
    id: 'ord-4594',
    orderNumber: '#4594G',
    customer: 'Michael Chen',
    date: '2026-05-25T15:45:00',
    dateLabel: '25 May at 3:45 pm',
    total: 176,
    items: 2,
    paymentStatus: 'Paid',
    fulfillmentStatus: 'Shipped',
    status: 'Shipped',
    channel: 'Online Store',
    deliveryMethod: 'express',
    deliveryStatus: 'In transit',
    tags: [],
  },
]

export type OrderStatsPeriod = 'today' | 'all'

export function getOrderStats(
  orders: StoreOrder[],
  period: OrderStatsPeriod = 'today',
) {
  const filtered =
    period === 'today'
      ? orders.filter((o) => o.dateLabel.toLowerCase().startsWith('today'))
      : orders

  const itemsOrdered = filtered.reduce((sum, o) => sum + o.items, 0)
  const fulfilled = filtered.filter(
    (o) =>
      o.fulfillmentStatus === 'Fulfilled' ||
      o.fulfillmentStatus === 'Shipped' ||
      o.fulfillmentStatus === 'Delivered',
  ).length
  const delivered = filtered.filter(
    (o) => o.fulfillmentStatus === 'Delivered',
  ).length

  return {
    orders: filtered.length,
    itemsOrdered,
    returns: 0,
    fulfilled,
    delivered,
  }
}
