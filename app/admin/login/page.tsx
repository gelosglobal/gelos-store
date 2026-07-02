import { Suspense } from 'react'
import { AdminLoginForm } from '@/components/admin/admin-login-form'

function AdminLoginFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-100">
      <p className="text-sm text-neutral-500">Loading sign in…</p>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<AdminLoginFallback />}>
      <AdminLoginForm />
    </Suspense>
  )
}
