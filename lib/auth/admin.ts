import { headers } from 'next/headers'
import { auth, type Session } from '@/lib/auth'

type AdminUser = Session['user'] & {
  role?: string | null
}

export function isAdminUser(user: AdminUser | null | undefined): boolean {
  if (!user) return false
  return user.role === 'admin'
}

export async function getAdminSession(): Promise<Session | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session || !isAdminUser(session.user as AdminUser)) {
    return null
  }
  return session
}
