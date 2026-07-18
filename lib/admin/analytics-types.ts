export type AnalyticsPeriod = 'today' | 'last7' | 'last30' | 'custom'

export type AnalyticsCustomRange = {
  startDate: string
  endDate: string
}

export type AnalyticsSnapshot = {
  totalSales: number
  orders: number
  customers: number
  sessions: number
  averageOrderValue: number
  avgSessionDurationSeconds: number
  salesChange: number
  customersChange: number
  ordersChange: number
  sessionsChange: number
  conversionRate: number
  conversionRateChange: number
}

export type TrafficTypeRow = {
  type: 'paid' | 'organic' | 'direct' | 'unknown'
  label: string
  sessions: number
  share: number
}

export type TrafficChannelRow = {
  channel: string
  label: string
  sessions: number
  share: number
}

export type AnalyticsSeriesPoint = {
  hour: string
  sales: number
  orders: number
  customers: number
  previous: number
}

export type SalesChannelRow = {
  channel: string
  share: number
  amount: number
}

export type CategoryRow = {
  category: string
  revenue: number
  orders: number
}

export type ProductRow = {
  product: string
  revenue: number
  units: number
}

export type PaymentStatusRow = {
  status: string
  count: number
  share: number
}

export type FeaturedInsight = {
  title: string
  body: string
  action: string
}

export type AnalyticsPayload = {
  snapshot: AnalyticsSnapshot
  series: AnalyticsSeriesPoint[]
  salesChannels: SalesChannelRow[]
  trafficTypes: TrafficTypeRow[]
  trafficChannels: TrafficChannelRow[]
  topCategories: CategoryRow[]
  topProducts: ProductRow[]
  paymentBreakdown: PaymentStatusRow[]
  insight: FeaturedInsight
}
