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
}
