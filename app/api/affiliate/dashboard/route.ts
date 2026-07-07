import { NextResponse } from 'next/server'
import { getAffiliateSession } from '@/lib/auth/affiliate'
import { findAffiliateByUserId } from '@/lib/db/affiliates'
import { getAffiliateDashboardPayload } from '@/lib/db/affiliate-dashboard'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getAffiliateSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const affiliate = await findAffiliateByUserId(session.user.id)
  if (!affiliate) {
    return NextResponse.json(
      { error: 'Affiliate profile not found.' },
      { status: 404 },
    )
  }

  const payload = await getAffiliateDashboardPayload(affiliate.affiliateId)
  if (!payload) {
    return NextResponse.json(
      { error: 'Affiliate dashboard unavailable.' },
      { status: 404 },
    )
  }

  return NextResponse.json(payload)
}
