import { NextResponse } from 'next/server'
import { affiliateRegistrationSchema } from '@/lib/affiliate-registration'
import { normalizeAffiliateCode } from '@/lib/affiliates'
import { submitAffiliateRegistration } from '@/lib/db/affiliates'
import { isDatabaseConfigured } from '@/lib/env'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const CODE_PATTERN = /^[A-Z0-9_-]+$/

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = normalizeAffiliateCode(searchParams.get('code') ?? '')

  if (!code || code.length < 3) {
    return NextResponse.json({ available: false, reason: 'too_short' as const })
  }

  if (!CODE_PATTERN.test(code)) {
    return NextResponse.json({ available: false, reason: 'invalid' as const })
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { available: false, reason: 'unavailable' as const },
      { status: 503 },
    )
  }

  try {
    const existing = await prisma.affiliate.findUnique({ where: { code } })
    return NextResponse.json({
      available: !existing,
      code,
      reason: existing ? ('taken' as const) : undefined,
    })
  } catch (error) {
    console.error('[GET /api/store/affiliate/register]', error)
    return NextResponse.json(
      { available: false, reason: 'error' as const },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const parsed = affiliateRegistrationSchema.safeParse(json)

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message ?? 'Invalid application'
      return NextResponse.json({ error: firstIssue }, { status: 400 })
    }

    const affiliate = await submitAffiliateRegistration(parsed.data)

    return NextResponse.json({
      ok: true,
      code: affiliate.code,
      message:
        'Application received. We will review it and email you when your affiliate account is approved.',
    })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'AFFILIATE_CODE_EXISTS') {
        return NextResponse.json(
          { error: 'That referral code is already taken. Try another one.' },
          { status: 409 },
        )
      }
      if (error.message === 'AFFILIATE_EMAIL_EXISTS') {
        return NextResponse.json(
          {
            error:
              'An application with this email already exists. Contact us if you need help.',
          },
          { status: 409 },
        )
      }
      if (error.message === 'DATABASE_NOT_CONFIGURED') {
        return NextResponse.json(
          { error: 'Applications are temporarily unavailable.' },
          { status: 503 },
        )
      }
    }

    console.error('[POST /api/store/affiliate/register]', error)
    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 },
    )
  }
}
