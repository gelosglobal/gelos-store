import { NextResponse } from 'next/server'
import { findAffiliateByCode } from '@/lib/db/affiliates'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')?.trim() ?? ''

  if (!code) {
    return NextResponse.json({ error: 'Affiliate code is required.' }, { status: 400 })
  }

  try {
    const affiliate = await findAffiliateByCode(code)
    if (!affiliate) {
      return NextResponse.json(
        { error: 'Invalid or inactive affiliate code.' },
        { status: 404 },
      )
    }

    return NextResponse.json({
      code: affiliate.code,
      name: affiliate.name,
      commissionPercent: affiliate.commissionPercent,
    })
  } catch (error) {
    console.error('[GET /api/store/affiliate]', error)
    return NextResponse.json(
      { error: 'Failed to validate affiliate code' },
      { status: 500 },
    )
  }
}
