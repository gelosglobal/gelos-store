export type PaymentStatus =
  | 'Paid'
  | 'Payment pending'
  | 'Partially paid'
  | 'Refunded'
  | 'Voided'
export type FulfillmentStatus =
  | 'Unfulfilled'
  | 'Fulfilled'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'

export type StoreOrderLineItem = {
  id: string
  name: string
  price: number
  quantity: number
  variantLabel?: string
  variantImage?: string
  productName?: string
  /** Enriched from catalog when available */
  image?: string
  category?: string
  productHref?: string
  lineTotal?: number
}

export type OrderTimelineEvent = {
  id: string
  title: string
  description?: string
  timestamp?: string
  timestampLabel?: string
  timestampFull?: string
  status: 'completed' | 'current' | 'upcoming'
}

export type OrderConversionSummary = {
  orderIndex: number
  totalOrders: number
  isFirstOrder: boolean
  orderIndexLabel: string
  referralSource: string
  firstVisitSource: string
  daysActive: number
  orderCountLabel: string
  daysActiveLabel: string
  details: OrderConversionDetails
}

export type OrderConversionDetails = {
  totalSessions: number
  daysToConversion: number
  firstSessionTitle: string
  firstSessionDate: string
  returnCount: number
  returnPeriodLabel: string
  conversionTitle: string
  conversionDate: string
  conversionVia: string
}

export type StoreOrder = {
  id: string
  orderNumber: string
  customer: string
  date: string
  /** Human-readable e.g. "Today at 11:11 am" */
  dateLabel: string
  total: number
  currency: string
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

export type AdminOrderDetail = StoreOrder & {
  customerEmail: string
  customerPhone?: string
  shippingAddress?: string
  lineItems: StoreOrderLineItem[]
  subtotal: number
  shipping: number
  discount: number
  paystackReference: string
  affiliateCode?: string
  affiliateId?: string
  commissionAmount: number
  commissionStatus: string
  createdAt: string
  updatedAt: string
  timeline: OrderTimelineEvent[]
  conversionSummary: OrderConversionSummary
}
