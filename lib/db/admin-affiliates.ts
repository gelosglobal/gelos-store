import { getAppUrl } from '@/lib/env'
import { buildAffiliateReferralUrl } from '@/lib/affiliates'
import { listStoredAffiliates, type StoredAffiliate } from '@/lib/db/affiliates'
import type { StoreAffiliate } from '@/lib/types/affiliate'

function storedToStoreAffiliate(stored: StoredAffiliate): StoreAffiliate {
  const baseUrl = getAppUrl()

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
