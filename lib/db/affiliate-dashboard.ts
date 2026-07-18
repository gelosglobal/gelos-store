import { getAppUrl, isDatabaseConfigured } from '@/lib/env'
import { formatOrderDateLabel } from '@/lib/admin/order-format'
import { revokeUnpaidAffiliateCommissions } from '@/lib/db/affiliates'
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

  await revokeUnpaidAffiliateCommissions(affiliate.affiliateId)

  const refreshed = await prisma.affiliate.findUnique({
    where: { affiliateId },
  })
  if (!refreshed) return null

  const orders = await prisma.order.findMany({
    where: { affiliateId: refreshed.affiliateId },
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
      id: refreshed.affiliateId,
      code: refreshed.code,
      name: refreshed.name,
      commissionPercent: refreshed.commissionPercent,
      enabled: refreshed.enabled,
      referralUrl: `${getAppUrl()}/?ref=${encodeURIComponent(refreshed.code)}`,
    },
    stats: {
      totalOrders: refreshed.totalOrders ?? 0,
      totalRevenue: refreshed.totalRevenue ?? 0,
      totalCommission: refreshed.totalCommission ?? 0,
      pendingCommission: refreshed.pendingCommission ?? 0,
      paidCommission: refreshed.paidCommission ?? 0,
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
