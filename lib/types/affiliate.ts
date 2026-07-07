export type CommissionStatus = 'none' | 'pending' | 'paid'

export type StoreAffiliate = {
  id: string
  code: string
  name: string
  email: string
  phone: string
  commissionPercent: number
  enabled: boolean
  totalOrders: number
  totalRevenue: number
  totalCommission: number
  pendingCommission: number
  paidCommission: number
  notes: string
  referralUrl: string
  createdAt: string
  payoutMethod: string
  payoutAccountName: string
  payoutAccountNumber: string
  payoutProvider: string
  payoutConfigured: boolean
}

export type AdminAffiliateOrder = {
  orderNumber: string
  date: string
  dateLabel: string
  total: number
  currency: string
  commissionAmount: number
  commissionStatus: string
  channel: string
}

export type AdminAffiliateDetail = StoreAffiliate & {
  recentOrders: AdminAffiliateOrder[]
}
