import { NextResponse } from 'next/server'

/**
 * Returns the visitor IP for Meta ParamBuilder getIpFn.
 * Prefer IPv6 when present in forwarded headers.
 */
export async function GET(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')?.trim()
  const ip =
    forwarded?.split(',')[0]?.trim() ||
    realIp ||
    ''

  return NextResponse.json(
    { ip },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  )
}
