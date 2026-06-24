import { createHash, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'

export const DENTIST_SESSION_COOKIE = 'gelos-dentist-session'
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

export function getDentistDashboardPassword(): string | undefined {
  const password = process.env.DENTIST_DASHBOARD_PASSWORD?.trim()
  return password || undefined
}

function hashToken(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

export function createDentistSessionToken(password: string): string {
  return hashToken(`dentist:${password}:gelos`)
}

export function verifyDentistPassword(password: string): boolean {
  const expected = getDentistDashboardPassword()
  if (!expected) return false

  const a = Buffer.from(password)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export function isDentistAuthConfigured(): boolean {
  return Boolean(getDentistDashboardPassword())
}

export async function setDentistSessionCookie() {
  const password = getDentistDashboardPassword()
  if (!password) return false

  const token = createDentistSessionToken(password)
  const cookieStore = await cookies()
  cookieStore.set(DENTIST_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  })
  return true
}

export async function clearDentistSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(DENTIST_SESSION_COOKIE)
}

export async function isDentistSessionValid(): Promise<boolean> {
  const password = getDentistDashboardPassword()
  if (!password) return false

  const cookieStore = await cookies()
  const token = cookieStore.get(DENTIST_SESSION_COOKIE)?.value
  if (!token) return false

  const expected = createDentistSessionToken(password)
  const a = Buffer.from(token)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export function getDentistPortalUrl(): string {
  return '/dentist'
}
