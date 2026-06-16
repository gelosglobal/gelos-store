import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAppUrl, isDatabaseConfigured } from '@/lib/env'
import { normalizeAffiliateCode } from '@/lib/affiliates'
import { formatOrderDateLabel } from '@/lib/admin/order-format'

export const dynamic = 'force-dynamic'

type AffiliateDashboardOrder = {
  orderNumber: string
  date: string
  dateLabel: string
  total: number
  currency: string
  commissionAmount: number
  commissionStatus: string
  channel: string
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const codeRaw = searchParams.get('code')?.trim() ?? ''
  const code = normalizeAffiliateCode(codeRaw)

  if (!code) {
    return NextResponse.json(
      { error: 'Affiliate code is required.' },
      { status: 400 },
    )
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: 'Database is not configured.' },
      { status: 503 },
    )
  }

  try {
    const affiliate = await prisma.affiliate.findFirst({
      where: { code, enabled: true },
    })

    if (!affiliate) {
      return NextResponse.json(
        { error: 'Invalid or inactive affiliate code.' },
        { status: 404 },
      )
    }

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

    const recentOrders: AffiliateDashboardOrder[] = orders.map((order) => ({
      orderNumber: order.orderNumber,
      date: order.createdAt.toISOString(),
      dateLabel: formatOrderDateLabel(order.createdAt),
      total: order.total,
      currency: order.currency,
      commissionAmount: order.commissionAmount ?? 0,
      commissionStatus: order.commissionStatus ?? 'none',
      channel: order.channel ?? 'Online store',
    }))

    const totalOrders = affiliate.totalOrders ?? 0
    const totalRevenue = affiliate.totalRevenue ?? 0
    const totalCommission = affiliate.totalCommission ?? 0
    const pendingCommission = affiliate.pendingCommission ?? 0
    const paidCommission = affiliate.paidCommission ?? 0

    return NextResponse.json({
      affiliate: {
        id: affiliate.affiliateId,
        code: affiliate.code,
        name: affiliate.name,
        commissionPercent: affiliate.commissionPercent,
        enabled: affiliate.enabled,
        referralUrl: `${getAppUrl()}/?ref=${encodeURIComponent(affiliate.code)}`,
      },
      stats: {
        totalOrders,
        totalRevenue,
        totalCommission,
        pendingCommission,
        paidCommission,
      },
      recentOrders,
    })
  } catch (error) {
    console.error('[GET /api/store/affiliate/dashboard]', error)
    return NextResponse.json(
      { error: 'Failed to load affiliate dashboard' },
      { status: 500 },
    )
  }
}

