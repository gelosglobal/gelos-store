import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  isDentistAuthConfigured,
  setDentistSessionCookie,
  verifyDentistPassword,
} from '@/lib/dentist/auth'

const loginSchema = z.object({
  password: z.string().min(1),
})

export async function POST(request: Request) {
  if (!isDentistAuthConfigured()) {
    return NextResponse.json(
      { error: 'Dentist dashboard is not configured yet.' },
      { status: 503 },
    )
  }

  const json = await request.json()
  const parsed = loginSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Password is required.' }, { status: 400 })
  }

  if (!verifyDentistPassword(parsed.data.password)) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 })
  }

  await setDentistSessionCookie()
  return NextResponse.json({ ok: true })
}
