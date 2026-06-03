export type AnalyticsPeriod = 'today' | 'last7' | 'last30'

export type AnalyticsSnapshot = {
  totalSales: number
  orders: number
  sessions: number
  conversionRate: number
  averageOrderValue: number
  salesChange: number
  sessionsChange: number
}

const snapshots: Record<AnalyticsPeriod, AnalyticsSnapshot> = {
  today: {
    totalSales: 1376,
    orders: 6,
    sessions: 361,
    conversionRate: 1.66,
    averageOrderValue: 229.33,
    salesChange: 18.4,
    sessionsChange: 42.1,
  },
  last7: {
    totalSales: 4820,
    orders: 22,
    sessions: 1840,
    conversionRate: 1.2,
    averageOrderValue: 219.09,
    salesChange: 8.2,
    sessionsChange: 12.5,
  },
  last30: {
    totalSales: 18640,
    orders: 78,
    sessions: 6420,
    conversionRate: 1.21,
    averageOrderValue: 238.97,
    salesChange: 12.5,
    sessionsChange: 9.8,
  },
}

export function getAnalyticsSnapshot(period: AnalyticsPeriod): AnalyticsSnapshot {
  return snapshots[period]
}

/** Hourly points for line charts (label = hour) */
export function getHourlySeries(period: AnalyticsPeriod) {
  const base =
    period === 'today'
      ? [
          { hour: '12 am', sales: 0, sessions: 12, orders: 0, previous: 0 },
          { hour: '3 am', sales: 0, sessions: 8, orders: 0, previous: 0 },
          { hour: '6 am', sales: 80, sessions: 28, orders: 1, previous: 40 },
          { hour: '9 am', sales: 168, sessions: 52, orders: 1, previous: 120 },
          { hour: '12 pm', sales: 320, sessions: 78, orders: 2, previous: 280 },
          { hour: '3 pm', sales: 528, sessions: 95, orders: 1, previous: 410 },
          { hour: '6 pm', sales: 880, sessions: 68, orders: 1, previous: 620 },
          { hour: '9 pm', sales: 1376, sessions: 20, orders: 0, previous: 900 },
        ]
      : period === 'last7'
        ? [
            { hour: 'Mon', sales: 620, sessions: 240, orders: 3, previous: 540 },
            { hour: 'Tue', sales: 840, sessions: 310, orders: 4, previous: 720 },
            { hour: 'Wed', sales: 720, sessions: 280, orders: 3, previous: 680 },
            { hour: 'Thu', sales: 980, sessions: 350, orders: 5, previous: 820 },
            { hour: 'Fri', sales: 1100, sessions: 380, orders: 4, previous: 900 },
            { hour: 'Sat', sales: 420, sessions: 180, orders: 2, previous: 380 },
            { hour: 'Sun', sales: 140, sessions: 100, orders: 1, previous: 120 },
          ]
        : [
            { hour: 'Jan', sales: 4200, sessions: 1200, orders: 18, previous: 3800 },
            { hour: 'Feb', sales: 3800, sessions: 1100, orders: 16, previous: 3500 },
            { hour: 'Mar', sales: 5100, sessions: 1400, orders: 22, previous: 4600 },
            { hour: 'Apr', sales: 4800, sessions: 1350, orders: 20, previous: 4400 },
            { hour: 'May', sales: 6200, sessions: 1680, orders: 26, previous: 5500 },
            { hour: 'Jun', sales: 4540, sessions: 1290, orders: 18, previous: 4100 },
          ]
  return base
}

export const salesChannels = [
  { channel: 'Online Store', share: 94, amount: 1294 },
  { channel: 'Instagram', share: 4, amount: 55 },
  { channel: 'Direct', share: 2, amount: 27 },
]

export const conversionFunnel = [
  { step: 'Sessions', count: 361, rate: 100 },
  { step: 'Added to cart', count: 20, rate: 5.54 },
  { step: 'Reached checkout', count: 17, rate: 4.71 },
  { step: 'Completed checkout', count: 6, rate: 1.66 },
]

export const trafficSources = [
  { source: 'Instagram', sessions: 128, share: 35.5 },
  { source: 'Direct', sessions: 98, share: 27.1 },
  { source: 'Google', sessions: 76, share: 21.1 },
  { source: 'Facebook', sessions: 42, share: 11.6 },
  { source: 'Other', sessions: 17, share: 4.7 },
]

export const topCategories = [
  { category: 'Toothpaste', revenue: 640, orders: 4 },
  { category: 'Mouthwash', revenue: 352, orders: 2 },
  { category: 'Whitening', revenue: 248, orders: 1 },
]

export const featuredInsight = {
  title: 'Instagram is driving more checkout sessions',
  body: 'Sessions from Instagram rose 28% this week. Toothpaste and mouthwash SKUs account for most add-to-cart events from that channel.',
  action: 'View channel report',
}
