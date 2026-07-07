import { Suspense } from 'react'
import { AffiliateLoginForm } from '@/components/affiliate/affiliate-login-form'

function AffiliateLoginFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <p className="text-sm text-neutral-500">Loading sign in…</p>
    </div>
  )
}

export default function AffiliateLoginPage() {
  return (
    <Suspense fallback={<AffiliateLoginFallback />}>
      <AffiliateLoginForm />
    </Suspense>
  )
}
