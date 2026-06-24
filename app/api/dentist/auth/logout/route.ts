import { NextResponse } from 'next/server'
import { clearDentistSessionCookie } from '@/lib/dentist/auth'

export async function POST() {
  await clearDentistSessionCookie()
  return NextResponse.json({ ok: true })
}
