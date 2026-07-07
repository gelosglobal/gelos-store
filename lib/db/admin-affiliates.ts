import { getAppUrl, isDatabaseConfigured } from '@/lib/env'
import { formatOrderDateLabel } from '@/lib/admin/order-format'
import { buildAffiliateReferralUrl } from '@/lib/affiliates'
import { isAffiliatePayoutConfigured } from '@/lib/affiliate/payout'
import {
  findStoredAffiliateById,
  listStoredAffiliates,
  type StoredAffiliate,
} from '@/lib/db/affiliates'
import { prisma } from '@/lib/prisma'
import type { AdminAffiliateDetail, StoreAffiliate } from '@/lib/types/affiliate'

function storedToStoreAffiliate(stored: StoredAffiliate): StoreAffiliate {
  const baseUrl = getAppUrl()
  const payout = {
    payoutMethod: stored.payoutMethod,
    payoutAccountName: stored.payoutAccountName,
    payoutAccountNumber: stored.payoutAccountNumber,
    payoutProvider: stored.payoutProvider,
  }

  return {
    id: stored.affiliateId,
    code: stored.code,
    name: stored.name,
    email: stored.email,
    phone: stored.phone,
    commissionPercent: stored.commissionPercent,
    enabled: stored.enabled,
    totalOrders: stored.totalOrders,
    totalRevenue: stored.totalRevenue,
    totalCommission: stored.totalCommission,
    pendingCommission: stored.pendingCommission,
    paidCommission: stored.paidCommission,
    notes: stored.notes,
    referralUrl: buildAffiliateReferralUrl(stored.code, baseUrl),
    createdAt: stored.createdAt.toISOString().slice(0, 10),
    payoutMethod: stored.payoutMethod,
    payoutAccountName: stored.payoutAccountName,
    payoutAccountNumber: stored.payoutAccountNumber,
    payoutProvider: stored.payoutProvider,
    payoutConfigured: isAffiliatePayoutConfigured(payout),
  }
}

export async function listAdminAffiliates(): Promise<StoreAffiliate[]> {
  const affiliates = await listStoredAffiliates()
  return affiliates.map(storedToStoreAffiliate)
}

export async function getAffiliateDashboardStats() {
  const affiliates = await listAdminAffiliates()

  return {
    totalAffiliates: affiliates.length,
    activeAffiliates: affiliates.filter((a) => a.enabled).length,
    totalOrders: affiliates.reduce((sum, a) => sum + a.totalOrders, 0),
    pendingCommission: affiliates.reduce((sum, a) => sum + a.pendingCommission, 0),
    paidCommission: affiliates.reduce((sum, a) => sum + a.paidCommission, 0),
  }
}

export async function getAdminAffiliateDetail(
  affiliateId: string,
): Promise<AdminAffiliateDetail | null> {
  if (!isDatabaseConfigured()) return null

  const stored = await findStoredAffiliateById(affiliateId)
  if (!stored) return null

  const orders = await prisma.order.findMany({
    where: { affiliateId: stored.affiliateId },
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
    ...storedToStoreAffiliate(stored),
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
