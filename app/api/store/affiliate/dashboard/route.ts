import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(
    {
      error:
        'Affiliate dashboard now requires sign in. Visit /affiliate/login to access your account.',
    },
    { status: 401 },
  )
}
