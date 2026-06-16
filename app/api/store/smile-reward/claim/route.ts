import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSmileRewardClaim } from '@/lib/db/smile-reward-claims'

export const dynamic = 'force-dynamic'

const rewardTypes = [
  'discount_15',
  'discount_20',
  'free_shipping',
  'product_gift',
  'bundle_bonus',
  'whitening_boost',
] as const

const bodySchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  customerName: z.string().trim().max(80).optional(),
  scanId: z.string().trim().max(120).optional(),
  winnerCardId: z.string().trim().min(1),
  rewardType: z.enum(rewardTypes),
  rewardTitle: z.string().trim().min(1).max(120),
  promoCode: z.string().trim().max(40).optional(),
  productHref: z.string().trim().max(200).optional(),
})

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const parsed = bodySchema.safeParse(json)

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message ?? 'Invalid claim'
      return NextResponse.json({ error: firstIssue }, { status: 400 })
    }

    const claim = await createSmileRewardClaim({
      email: parsed.data.email,
      customerName: parsed.data.customerName,
      scanId: parsed.data.scanId,
      rewardType: parsed.data.rewardType,
      rewardTitle: parsed.data.rewardTitle,
      promoCode: parsed.data.promoCode,
      productHref: parsed.data.productHref,
    })

    return NextResponse.json({
      ok: true,
      claimId: claim.claimId,
    })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'REWARD_ALREADY_CLAIMED') {
        return NextResponse.json(
          {
            error:
              'This email has already claimed a smile scan reward. One reward per email.',
            alreadyClaimed: true,
          },
          { status: 409 },
        )
      }
      if (error.message === 'DATABASE_NOT_CONFIGURED') {
        return NextResponse.json(
          { error: 'Reward claims are temporarily unavailable.' },
          { status: 503 },
        )
      }
    }

    console.error('[POST /api/store/smile-reward/claim]', error)
    return NextResponse.json({ error: 'Failed to claim reward' }, { status: 500 })
  }
}
