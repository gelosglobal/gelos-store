import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { isAffiliateUser } from '@/lib/auth/affiliate'

export default async function AffiliateIndexPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (session && isAffiliateUser(session.user)) {
    redirect('/affiliate/dashboard')
  }

  redirect('/affiliate/login')
}
