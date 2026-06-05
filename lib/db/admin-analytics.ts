import type { Order as PrismaOrder } from '@prisma/client'
import type { CheckoutLineItem } from '@/lib/checkout'
import type {
  AnalyticsPayload,
  AnalyticsPeriod,
  AnalyticsSeriesPoint,
  AnalyticsSnapshot,
  CategoryRow,
  FeaturedInsight,
  PaymentStatusRow,
  ProductRow,
  SalesChannelRow,
} from '@/lib/admin/analytics-types'
import { isDatabaseConfigured } from '@/lib/env'
import { prisma } from '@/lib/prisma'
import { getAllProducts } from '@/lib/db/products'

const DEFAULT_RATES: Record<string, number> = {
  GHS: 1,
  USD: 0.064,
  NGN: 108,
}

function getRates(): Record<string, number> {
  const raw = process.env.EXCHANGE_RATES?.trim()
  if (!raw) return DEFAULT_RATES
  try {
    return { ...DEFAULT_RATES, ...(JSON.parse(raw) as Record<string, number>) }
  } catch {
    return DEFAULT_RATES
  }
}

function convertToBase(amount: number, currency: string): number {
  const rate = getRates()[currency.toUpperCase()] ?? 1
  if (!rate) return amount
  return Math.round((amount / rate) * 100) / 100
}

function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 1000) / 10
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function periodRange(period: AnalyticsPeriod, now = new Date()) {
  const end = now
  const start = new Date(now)

  if (period === 'today') {
    return { start: startOfDay(now), end, previousStart: new Date(startOfDay(now).getTime() - 86_400_000), previousEnd: startOfDay(now) }
  }

  const days = period === 'last7' ? 7 : 30
  start.setDate(start.getDate() - days)
  const previousEnd = new Date(start)
  const previousStart = new Date(start)
  previousStart.setDate(previousStart.getDate() - days)

  return { start, end, previousStart, previousEnd }
}

function inRange(date: Date, start: Date, end: Date): boolean {
  return date >= start && date < end
}

function formatChannel(channel: string): string {
  if (/paystack/i.test(channel)) return 'Paystack'
  if (/cash on delivery/i.test(channel)) return 'Cash on delivery'
  return channel.trim() || 'Online store'
}

function emptyPayload(period: AnalyticsPeriod): AnalyticsPayload {
  return {
    snapshot: {
      totalSales: 0,
      orders: 0,
      customers: 0,
      averageOrderValue: 0,
      salesChange: 0,
      customersChange: 0,
    },
    series: buildEmptySeries(period),
    salesChannels: [],
    topCategories: [],
    topProducts: [],
    paymentBreakdown: [],
    insight: {
      title: 'No sales data yet',
      body: 'Charts and insights will populate once customers start placing orders.',
      action: 'View orders',
    },
  }
}

function buildEmptySeries(period: AnalyticsPeriod): AnalyticsSeriesPoint[] {
  if (period === 'today') {
    return ['12 am', '3 am', '6 am', '9 am', '12 pm', '3 pm', '6 pm', '9 pm'].map(
      (hour) => ({ hour, sales: 0, orders: 0, customers: 0, previous: 0 }),
    )
  }
  if (period === 'last7') {
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((hour) => ({
      hour,
      sales: 0,
      orders: 0,
      customers: 0,
      previous: 0,
    }))
  }
  return Array.from({ length: 6 }, (_, index) => ({
    hour: `W${index + 1}`,
    sales: 0,
    orders: 0,
    customers: 0,
    previous: 0,
  }))
}

function uniqueCustomers(orders: PrismaOrder[]): number {
  const keys = new Set<string>()
  for (const order of orders) {
    keys.add(order.customerEmail.trim().toLowerCase())
  }
  return keys.size
}

function sumSales(orders: PrismaOrder[]): number {
  return orders.reduce(
    (sum, order) => sum + convertToBase(order.total, order.currency),
    0,
  )
}

function buildSnapshot(
  current: PrismaOrder[],
  previous: PrismaOrder[],
): AnalyticsSnapshot {
  const totalSales = sumSales(current)
  const orders = current.length
  const customers = uniqueCustomers(current)
  const previousSales = sumSales(previous)
  const previousCustomers = uniqueCustomers(previous)

  return {
    totalSales,
    orders,
    customers,
    averageOrderValue: orders > 0 ? Math.round((totalSales / orders) * 100) / 100 : 0,
    salesChange: percentChange(totalSales, previousSales),
    customersChange: percentChange(customers, previousCustomers),
  }
}

function buildTodaySeries(
  current: PrismaOrder[],
  previous: PrismaOrder[],
): AnalyticsSeriesPoint[] {
  const buckets = [0, 3, 6, 9, 12, 15, 18, 21]
  return buckets.map((hour) => {
    const label =
      hour === 0
        ? '12 am'
        : hour === 12
          ? '12 pm'
          : hour < 12
            ? `${hour} am`
            : `${hour - 12} pm`

    const currentBucket = current.filter((order) => order.createdAt.getHours() >= hour && order.createdAt.getHours() < hour + 3)
    const previousBucket = previous.filter((order) => order.createdAt.getHours() >= hour && order.createdAt.getHours() < hour + 3)

    return {
      hour: label,
      sales: sumSales(currentBucket),
      orders: currentBucket.length,
      customers: uniqueCustomers(currentBucket),
      previous: sumSales(previousBucket),
    }
  })
}

function buildLast7Series(
  current: PrismaOrder[],
  previous: PrismaOrder[],
  rangeStart: Date,
): AnalyticsSeriesPoint[] {
  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return Array.from({ length: 7 }, (_, index) => {
    const dayStart = new Date(rangeStart)
    dayStart.setDate(dayStart.getDate() + index)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)

    const prevDayStart = new Date(dayStart)
    prevDayStart.setDate(prevDayStart.getDate() - 7)
    const prevDayEnd = new Date(prevDayStart)
    prevDayEnd.setDate(prevDayEnd.getDate() + 1)

    const currentBucket = current.filter((order) => inRange(order.createdAt, dayStart, dayEnd))
    const previousBucket = previous.filter((order) => inRange(order.createdAt, prevDayStart, prevDayEnd))

    return {
      hour: labels[dayStart.getDay()],
      sales: sumSales(currentBucket),
      orders: currentBucket.length,
      customers: uniqueCustomers(currentBucket),
      previous: sumSales(previousBucket),
    }
  })
}

function buildLast30Series(
  current: PrismaOrder[],
  previous: PrismaOrder[],
  rangeStart: Date,
): AnalyticsSeriesPoint[] {
  const bucketCount = 6
  const bucketDays = 5

  return Array.from({ length: bucketCount }, (_, index) => {
    const bucketStart = new Date(rangeStart)
    bucketStart.setDate(bucketStart.getDate() + index * bucketDays)
    const bucketEnd = new Date(bucketStart)
    bucketEnd.setDate(bucketEnd.getDate() + bucketDays)

    const prevBucketStart = new Date(bucketStart)
    prevBucketStart.setDate(prevBucketStart.getDate() - 30)
    const prevBucketEnd = new Date(prevBucketStart)
    prevBucketEnd.setDate(prevBucketEnd.getDate() + bucketDays)

    const currentBucket = current.filter((order) => inRange(order.createdAt, bucketStart, bucketEnd))
    const previousBucket = previous.filter((order) => inRange(order.createdAt, prevBucketStart, prevBucketEnd))

    const label = bucketStart.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    })

    return {
      hour: label,
      sales: sumSales(currentBucket),
      orders: currentBucket.length,
      customers: uniqueCustomers(currentBucket),
      previous: sumSales(previousBucket),
    }
  })
}

function buildSeries(
  period: AnalyticsPeriod,
  current: PrismaOrder[],
  previous: PrismaOrder[],
  rangeStart: Date,
): AnalyticsSeriesPoint[] {
  if (period === 'today') return buildTodaySeries(current, previous)
  if (period === 'last7') return buildLast7Series(current, previous, rangeStart)
  return buildLast30Series(current, previous, rangeStart)
}

function buildSalesChannels(orders: PrismaOrder[]): SalesChannelRow[] {
  const totals = new Map<string, number>()
  for (const order of orders) {
    const channel = formatChannel(order.channel)
    totals.set(channel, (totals.get(channel) ?? 0) + convertToBase(order.total, order.currency))
  }

  const totalSales = Array.from(totals.values()).reduce((sum, value) => sum + value, 0)
  if (totalSales <= 0) return []

  return Array.from(totals.entries())
    .map(([channel, amount]) => ({
      channel,
      amount: Math.round(amount * 100) / 100,
      share: Math.round((amount / totalSales) * 1000) / 10,
    }))
    .sort((a, b) => b.amount - a.amount)
}

function buildTopCategories(
  orders: PrismaOrder[],
  categoryByProductId: Map<string, string>,
): CategoryRow[] {
  const revenue = new Map<string, number>()
  const orderCounts = new Map<string, Set<string>>()

  for (const order of orders) {
    const items = Array.isArray(order.items) ? (order.items as CheckoutLineItem[]) : []
    for (const item of items) {
      const category = categoryByProductId.get(item.id) ?? 'Other'
      const lineTotal = convertToBase(item.price * item.quantity, order.currency)
      revenue.set(category, (revenue.get(category) ?? 0) + lineTotal)
      const orderSet = orderCounts.get(category) ?? new Set<string>()
      orderSet.add(order.id)
      orderCounts.set(category, orderSet)
    }
  }

  return Array.from(revenue.entries())
    .map(([category, amount]) => ({
      category,
      revenue: Math.round(amount * 100) / 100,
      orders: orderCounts.get(category)?.size ?? 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
}

function buildTopProducts(orders: PrismaOrder[]): ProductRow[] {
  const revenue = new Map<string, number>()
  const units = new Map<string, number>()

  for (const order of orders) {
    const items = Array.isArray(order.items) ? (order.items as CheckoutLineItem[]) : []
    for (const item of items) {
      const name = item.name?.trim() || 'Product'
      const lineTotal = convertToBase(item.price * item.quantity, order.currency)
      revenue.set(name, (revenue.get(name) ?? 0) + lineTotal)
      units.set(name, (units.get(name) ?? 0) + (item.quantity || 0))
    }
  }

  return Array.from(revenue.entries())
    .map(([product, amount]) => ({
      product,
      revenue: Math.round(amount * 100) / 100,
      units: units.get(product) ?? 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
}

function buildPaymentBreakdown(orders: PrismaOrder[]): PaymentStatusRow[] {
  const counts = new Map<string, number>()
  for (const order of orders) {
    const status = order.paymentStatus === 'Paid' ? 'Paid' : 'Payment pending'
    counts.set(status, (counts.get(status) ?? 0) + 1)
  }

  const total = orders.length
  if (total === 0) return []

  return Array.from(counts.entries()).map(([status, count]) => ({
    status,
    count,
    share: Math.round((count / total) * 1000) / 10,
  }))
}

function buildInsight(
  snapshot: AnalyticsSnapshot,
  salesChannels: SalesChannelRow[],
  topCategories: CategoryRow[],
): FeaturedInsight {
  if (snapshot.orders === 0) {
    return {
      title: 'No sales data yet',
      body: 'Charts and insights will populate once customers start placing orders.',
      action: 'View orders',
    }
  }

  const topChannel = salesChannels[0]
  if (topChannel && snapshot.salesChange > 0) {
    return {
      title: `${topChannel.channel} is leading sales`,
      body: `${topChannel.channel} accounts for ${topChannel.share}% of revenue in this period, with sales up ${snapshot.salesChange}% vs the previous period.`,
      action: 'View orders',
    }
  }

  const topCategory = topCategories[0]
  if (topCategory) {
    return {
      title: `${topCategory.category} is your top category`,
      body: `${topCategory.category} generated GH₵${topCategory.revenue.toLocaleString()} across ${topCategory.orders} order${topCategory.orders === 1 ? '' : 's'} in this period.`,
      action: 'View products',
    }
  }

  return {
    title: `${snapshot.orders} orders in this period`,
    body: `Total sales reached GH₵${snapshot.totalSales.toLocaleString()} with an average order value of GH₵${snapshot.averageOrderValue.toLocaleString()}.`,
    action: 'View orders',
  }
}

export async function getAdminAnalytics(
  period: AnalyticsPeriod,
): Promise<AnalyticsPayload> {
  if (!isDatabaseConfigured()) return emptyPayload(period)

  const now = new Date()
  const { start, end, previousStart, previousEnd } = periodRange(period, now)

  const [orders, products] = await Promise.all([
    prisma.order.findMany({ orderBy: { createdAt: 'desc' } }),
    getAllProducts(),
  ])

  const categoryByProductId = new Map(products.map((product) => [product.id, product.category]))

  const current = orders.filter((order) => inRange(order.createdAt, start, end))
  const previous = orders.filter((order) =>
    inRange(order.createdAt, previousStart, previousEnd),
  )

  const snapshot = buildSnapshot(current, previous)
  const salesChannels = buildSalesChannels(current)
  const topCategories = buildTopCategories(current, categoryByProductId)
  const topProducts = buildTopProducts(current)
  const paymentBreakdown = buildPaymentBreakdown(current)

  return {
    snapshot,
    series: buildSeries(period, current, previous, start),
    salesChannels,
    topCategories,
    topProducts,
    paymentBreakdown,
    insight: buildInsight(snapshot, salesChannels, topCategories),
  }
}
