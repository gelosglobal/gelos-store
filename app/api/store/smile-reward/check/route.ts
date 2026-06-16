import { NextResponse } from 'next/server'
import { z } from 'zod'
import { hasSmileRewardClaim } from '@/lib/db/smile-reward-claims'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
})

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const parsed = bodySchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Enter a valid email address.' },
        { status: 400 },
      )
    }

    const alreadyClaimed = await hasSmileRewardClaim(parsed.data.email)

    return NextResponse.json({
      eligible: !alreadyClaimed,
      alreadyClaimed,
    })
  } catch (error) {
    console.error('[POST /api/store/smile-reward/check]', error)
    return NextResponse.json(
      { error: 'Could not verify reward eligibility' },
      { status: 500 },
    )
  }
}
