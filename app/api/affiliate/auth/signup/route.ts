import { NextResponse } from 'next/server'
import { hashPassword } from 'better-auth/crypto'
import { z } from 'zod'
import {
  findInvitedAffiliateByEmail,
  linkAffiliateToUser,
} from '@/lib/db/affiliates'
import { isDatabaseConfigured } from '@/lib/env'
import { prisma } from '@/lib/prisma'

const bodySchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().trim().min(2).max(120).optional(),
})

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: 'Database is not configured.' },
      { status: 503 },
    )
  }

  try {
    const json = await request.json()
    const parsed = bodySchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid signup' },
        { status: 400 },
      )
    }

    const email = parsed.data.email.trim().toLowerCase()
    const affiliate = await findInvitedAffiliateByEmail(email)

    if (!affiliate) {
      return NextResponse.json(
        {
          error:
            'No active affiliate invitation found for this email. Contact Gelos if you believe this is a mistake.',
        },
        { status: 403 },
      )
    }

    if (affiliate.userId.trim()) {
      return NextResponse.json(
        { error: 'An account already exists for this affiliate. Please sign in.' },
        { status: 409 },
      )
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in.' },
        { status: 409 },
      )
    }

    const hashedPassword = await hashPassword(parsed.data.password)
    const name = parsed.data.name?.trim() || affiliate.name

    const user = await prisma.user.create({
      data: {
        name,
        email,
        emailVerified: true,
        role: 'affiliate',
      },
    })

    await prisma.account.create({
      data: {
        userId: user.id,
        accountId: user.id,
        providerId: 'credential',
        password: hashedPassword,
      },
    })

    await linkAffiliateToUser(affiliate.affiliateId, user.id)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[POST /api/affiliate/auth/signup]', error)
    return NextResponse.json(
      { error: 'Failed to create affiliate account' },
      { status: 500 },
    )
  }
}
