import { NextResponse } from 'next/server'
import { z } from 'zod'
import { isDhlConfigured } from '@/lib/dhl/config'
import { validateDhlAddress } from '@/lib/dhl/address'

const bodySchema = z.object({
  countryCode: z.string().trim().length(2),
  cityName: z.string().trim().min(2).max(80),
  postalCode: z.string().trim().max(20).optional(),
  type: z.enum(['delivery', 'pickup']).optional(),
})

export async function POST(request: Request) {
  if (!isDhlConfigured()) {
    return NextResponse.json(
      { error: 'DHL Express is not configured', configured: false },
      { status: 503 },
    )
  }

  try {
    const json = await request.json()
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid address', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const result = await validateDhlAddress(parsed.data)
    return NextResponse.json({ ok: true, configured: true, ...result })
  } catch (error) {
    console.error('[POST /api/dhl/address-validate]', error)
    const message =
      error instanceof Error ? error.message : 'Address validation failed'
    return NextResponse.json({ error: message, configured: true }, { status: 502 })
  }
}
