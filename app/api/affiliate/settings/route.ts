import { NextResponse } from 'next/server'
import {
  isAffiliatePayoutConfigured,
  normalizeAffiliatePayoutInput,
  validateAffiliatePayoutInput,
  type AffiliatePayoutSettings,
} from '@/lib/affiliate/payout'
import {
  normalizeAffiliateCode,
  validateAffiliateReferralCode,
} from '@/lib/affiliates'
import { getAffiliateSession } from '@/lib/auth/affiliate'
import { getAppUrl } from '@/lib/env'
import {
  findAffiliateByUserId,
  toAffiliatePayoutSettings,
  updateAffiliatePayoutSettings,
  updateAffiliateReferralCode,
  type StoredAffiliate,
} from '@/lib/db/affiliates'

export const dynamic = 'force-dynamic'

export type AffiliateSettingsPayload = {
  affiliate: {
    name: string
    email: string
    phone: string
    code: string
    commissionPercent: number
    referralUrl: string
  }
  payout: AffiliatePayoutSettings
  payoutConfigured: boolean
}

function buildSettingsPayload(affiliate: StoredAffiliate): AffiliateSettingsPayload {
  const payout = toAffiliatePayoutSettings(affiliate)

  return {
    affiliate: {
      name: affiliate.name,
      email: affiliate.email,
      phone: affiliate.phone,
      code: affiliate.code,
      commissionPercent: affiliate.commissionPercent,
      referralUrl: `${getAppUrl()}/?ref=${encodeURIComponent(affiliate.code)}`,
    },
    payout,
    payoutConfigured: isAffiliatePayoutConfigured(payout),
  }
}

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

  return NextResponse.json(buildSettingsPayload(affiliate))
}

type AffiliateSettingsPatchBody = Partial<AffiliatePayoutSettings> & {
  code?: string
}

export async function PATCH(request: Request) {
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

  let json: AffiliateSettingsPatchBody
  try {
    json = (await request.json()) as AffiliateSettingsPatchBody
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  let updated = affiliate

  if (json.code !== undefined) {
    const normalizedCode = normalizeAffiliateCode(json.code)
    const validationError = validateAffiliateReferralCode(normalizedCode)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    if (normalizedCode !== affiliate.code) {
      try {
        updated = await updateAffiliateReferralCode(
          affiliate.affiliateId,
          normalizedCode,
        )
      } catch (error) {
        if (error instanceof Error && error.message === 'AFFILIATE_CODE_EXISTS') {
          return NextResponse.json(
            { error: 'That referral code is already taken. Try another one.' },
            { status: 409 },
          )
        }
        throw error
      }
    }
  }

  const hasPayoutUpdate =
    json.payoutMethod !== undefined ||
    json.payoutAccountName !== undefined ||
    json.payoutAccountNumber !== undefined ||
    json.payoutProvider !== undefined

  if (hasPayoutUpdate) {
    const payout = normalizeAffiliatePayoutInput({
      payoutMethod: json.payoutMethod ?? updated.payoutMethod,
      payoutAccountName: json.payoutAccountName ?? updated.payoutAccountName,
      payoutAccountNumber:
        json.payoutAccountNumber ?? updated.payoutAccountNumber,
      payoutProvider: json.payoutProvider ?? updated.payoutProvider,
    })

    const validationError = validateAffiliatePayoutInput(payout)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    updated = await updateAffiliatePayoutSettings(updated.affiliateId, payout)
  }

  return NextResponse.json(buildSettingsPayload(updated))
}
