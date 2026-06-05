import { isOrderToday } from '@/lib/admin/order-format'
import type { StoreOrder } from '@/lib/types/order'

export type OrderStatsPeriod = 'today' | 'all'

export function getOrderStats(
  orders: StoreOrder[],
  period: OrderStatsPeriod = 'today',
) {
  const filtered =
    period === 'today' ? orders.filter((o) => isOrderToday(o.date)) : orders

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
