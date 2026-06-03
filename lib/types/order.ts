export type PaymentStatus = 'Paid' | 'Payment pending'
export type FulfillmentStatus =
  | 'Unfulfilled'
  | 'Fulfilled'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'

export type StoreOrder = {
  id: string
  orderNumber: string
  customer: string
  date: string
  /** Human-readable e.g. "Today at 11:11 am" */
  dateLabel: string
  total: number
  items: number
  paymentStatus: PaymentStatus
  fulfillmentStatus: FulfillmentStatus
  channel: string
  deliveryMethod: string
  fulfillBy?: string
  deliveryStatus?: string
  tags: string[]
  /** @deprecated Use fulfillmentStatus — kept for older admin views */
  status: FulfillmentStatus
}
