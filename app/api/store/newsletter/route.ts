import { NextResponse } from 'next/server'
import { z } from 'zod'
import { subscribeNewsletterEmail } from '@/lib/db/customers'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  email: z.string().trim().email().max(200),
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

    const result = await subscribeNewsletterEmail(parsed.data.email)

    if (!result.ok) {
      if (result.reason === 'invalid_email') {
        return NextResponse.json(
          { error: 'Enter a valid email address.' },
          { status: 400 },
        )
      }
      return NextResponse.json(
        { error: 'Could not subscribe right now. Please try again.' },
        { status: 503 },
      )
    }

    return NextResponse.json({
      ok: true,
      status: result.status,
    })
  } catch (error) {
    console.error('[POST /api/store/newsletter]', error)
    return NextResponse.json(
      { error: 'Could not subscribe right now. Please try again.' },
      { status: 500 },
    )
  }
}
