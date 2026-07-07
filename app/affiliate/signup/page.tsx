import { Suspense } from 'react'
import { AffiliateSignupForm } from '@/components/affiliate/affiliate-signup-form'

function AffiliateSignupFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <p className="text-sm text-neutral-500">Loading sign up…</p>
    </div>
  )
}

export default function AffiliateSignupPage() {
  return (
    <Suspense fallback={<AffiliateSignupFallback />}>
      <AffiliateSignupForm />
    </Suspense>
  )
}
