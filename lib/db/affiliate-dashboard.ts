import { getAppUrl, isDatabaseConfigured } from '@/lib/env'
import { formatOrderDateLabel } from '@/lib/admin/order-format'
import { prisma } from '@/lib/prisma'

export type AffiliateDashboardPayload = {
  affiliate: {
    id: string
    code: string
    name: string
    commissionPercent: number
    enabled: boolean
    referralUrl: string
  }
  stats: {
    totalOrders: number
    totalRevenue: number
    totalCommission: number
    pendingCommission: number
    paidCommission: number
  }
  recentOrders: {
    orderNumber: string
    date: string
    dateLabel: string
    total: number
    currency: string
    commissionAmount: number
    commissionStatus: string
    channel: string
  }[]
}

export async function getAffiliateDashboardPayload(
  affiliateId: string,
): Promise<AffiliateDashboardPayload | null> {
  if (!isDatabaseConfigured()) return null

  const affiliate = await prisma.affiliate.findUnique({
    where: { affiliateId },
  })

  if (!affiliate || !affiliate.enabled) return null

  const orders = await prisma.order.findMany({
    where: { affiliateId: affiliate.affiliateId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      orderNumber: true,
      createdAt: true,
      total: true,
      currency: true,
      commissionAmount: true,
      commissionStatus: true,
      channel: true,
    },
  })

  return {
    affiliate: {
      id: affiliate.affiliateId,
      code: affiliate.code,
      name: affiliate.name,
      commissionPercent: affiliate.commissionPercent,
      enabled: affiliate.enabled,
      referralUrl: `${getAppUrl()}/?ref=${encodeURIComponent(affiliate.code)}`,
    },
    stats: {
      totalOrders: affiliate.totalOrders ?? 0,
      totalRevenue: affiliate.totalRevenue ?? 0,
      totalCommission: affiliate.totalCommission ?? 0,
      pendingCommission: affiliate.pendingCommission ?? 0,
      paidCommission: affiliate.paidCommission ?? 0,
    },
    recentOrders: orders.map((order) => ({
      orderNumber: order.orderNumber,
      date: order.createdAt.toISOString(),
      dateLabel: formatOrderDateLabel(order.createdAt),
      total: order.total,
      currency: order.currency,
      commissionAmount: order.commissionAmount ?? 0,
      commissionStatus: order.commissionStatus ?? 'none',
      channel: order.channel ?? 'Online store',
    })),
  }
}
