import type { Order as PrismaOrder } from '@prisma/client'
import { formatConversionDate } from '@/lib/admin/order-format'
import type { OrderConversionDetails, OrderConversionSummary } from '@/lib/types/order'

type CustomerOrderSnapshot = Pick<
  PrismaOrder,
  'id' | 'createdAt' | 'affiliateCode' | 'channel'
>

function ordinal(value: number): string {
  const mod100 = value % 100
  if (mod100 >= 11 && mod100 <= 13) return `${value}th`
  switch (value % 10) {
    case 1:
      return `${value}st`
    case 2:
      return `${value}nd`
    case 3:
      return `${value}rd`
    default:
      return `${value}th`
  }
}

export function formatOrderReferralSource(order: {
  affiliateCode?: string | null
  channel?: string | null
}): string {
  const affiliateCode = order.affiliateCode?.trim()
  if (affiliateCode) return affiliateCode

  const channel = order.channel?.trim() ?? ''
  if (/online store/i.test(channel)) return 'Online Store'
  if (/paystack/i.test(channel)) return 'Paystack checkout'
  if (/cash on delivery/i.test(channel)) return 'Cash on delivery'
  return channel || 'Online Store'
}

function daysBetween(start: Date, end: Date): number {
  const ms = Math.abs(end.getTime() - start.getTime())
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)))
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function isDirectSource(source: string): boolean {
  return /online store/i.test(source) || source === 'Online Store'
}

function estimateTotalSessions(orderIndex: number, daysActive: number): number {
  if (daysActive <= 1 && orderIndex === 1) return 1

  const fromDays = Math.max(2, Math.ceil(daysActive / 2))
  const fromOrders = orderIndex === 1 ? 2 : orderIndex + 1
  return Math.max(fromDays, fromOrders)
}

function buildConversionDetails(
  order: PrismaOrder,
  orderIndex: number,
  daysActive: number,
  referralSource: string,
  firstVisitSource: string,
): OrderConversionDetails {
  const convertedAt = order.createdAt
  const daysToConversion = daysActive
  const totalSessions = estimateTotalSessions(orderIndex, daysActive)
  const returnCount = Math.max(0, totalSessions - 2)
  const firstSessionAt = addDays(convertedAt, -(daysToConversion - 1))
  const returnPeriodEnd =
    returnCount > 0 ? addDays(convertedAt, -1) : firstSessionAt

  const firstSessionTitle = isDirectSource(firstVisitSource)
    ? '1st session was direct to your store'
    : `1st session was from ${firstVisitSource}`

  const affiliateCode = order.affiliateCode?.trim()
  let conversionTitle: string
  if (affiliateCode) {
    conversionTitle = `Converted after a visit from ${affiliateCode}`
  } else if (isDirectSource(referralSource)) {
    conversionTitle = 'Converted after a direct visit to your store'
  } else {
    conversionTitle = `Converted after a visit from ${referralSource}`
  }

  let conversionVia: string
  if (affiliateCode) {
    conversionVia = 'Via Affiliate'
  } else if (/paystack/i.test(order.channel)) {
    conversionVia = 'Via Paystack'
  } else if (/cash on delivery/i.test(order.channel)) {
    conversionVia = 'Via Cash on delivery'
  } else {
    conversionVia = 'Via Online store'
  }

  const returnPeriodLabel =
    returnCount > 0
      ? `${formatConversionDate(firstSessionAt)} – ${formatConversionDate(returnPeriodEnd)}`
      : ''

  return {
    totalSessions,
    daysToConversion,
    firstSessionTitle,
    firstSessionDate: formatConversionDate(firstSessionAt),
    returnCount,
    returnPeriodLabel,
    conversionTitle,
    conversionDate: formatConversionDate(convertedAt),
    conversionVia,
  }
}

export function buildOrderConversionSummary(
  order: PrismaOrder,
  customerOrders: CustomerOrderSnapshot[],
): OrderConversionSummary {
  const sorted = [...customerOrders].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  )
  const totalOrders = sorted.length
  const orderIndex = Math.max(
    1,
    sorted.findIndex((entry) => entry.id === order.id) + 1,
  )
  const firstOrder = sorted[0]
  const daysActive = firstOrder
    ? daysBetween(firstOrder.createdAt, order.createdAt)
    : 1

  const referralSource = formatOrderReferralSource(order)
  const firstVisitSource = firstOrder
    ? formatOrderReferralSource(firstOrder)
    : referralSource

  return {
    orderIndex,
    totalOrders,
    isFirstOrder: orderIndex === 1,
    orderIndexLabel: ordinal(orderIndex),
    referralSource,
    firstVisitSource,
    daysActive,
    orderCountLabel: totalOrders === 1 ? '1 order' : `${totalOrders} orders`,
    daysActiveLabel: daysActive === 1 ? '1 day' : `${daysActive} days`,
    details: buildConversionDetails(
      order,
      orderIndex,
      daysActive,
      referralSource,
      firstVisitSource,
    ),
  }
}
