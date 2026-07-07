import { headers } from 'next/headers'
import { auth, type Session } from '@/lib/auth'

type AffiliateUser = Session['user'] & {
  role?: string | null
}

export function isAffiliateUser(user: AffiliateUser | null | undefined): boolean {
  if (!user) return false
  return user.role === 'affiliate'
}

export async function getAffiliateSession(): Promise<Session | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session || !isAffiliateUser(session.user as AffiliateUser)) {
    return null
  }
  return session
}
