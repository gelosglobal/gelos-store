'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { signIn, signOut, useSession, authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function AdminLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(
    searchParams.get('error') === 'forbidden'
      ? 'You do not have admin access.'
      : null,
  )
  const [loading, setLoading] = useState(false)

  const nextPath = searchParams.get('next') || '/admin'

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (loading) return

    setLoading(true)
    setError(null)

    try {
      const result = await signIn.email({
        email: email.trim(),
        password,
      })

      if (result.error) {
        setError(result.error.message ?? 'Sign in failed.')
        return
      }

      const session = await authClient.getSession()
      const role = (session.data?.user as { role?: string } | undefined)?.role

      if (role !== 'admin') {
        await signOut()
        setError('You do not have admin access.')
        return
      }

      router.replace(nextPath.startsWith('/admin') ? nextPath : '/admin')
      router.refresh()
    } catch {
      setError('Sign in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-100 px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <Image
            src="/gelos/gelos-logo.png"
            alt="Gelos"
            width={140}
            height={36}
            className="mx-auto h-9 w-auto"
            style={{ width: 'auto' }}
            priority
          />
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-neutral-950">
            Admin
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Sign in to manage products, orders, and store settings.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-email">Email</Label>
            <Input
              id="admin-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@gelosglobal.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-password">Password</Label>
            <div className="relative">
              <Input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 transition-colors hover:text-neutral-950"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {error ? (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}

          <Button
            type="submit"
            className="h-11 w-full rounded-full bg-neutral-950 hover:bg-neutral-800"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign in'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          <Link href="/" className="font-medium text-neutral-800 hover:underline">
            Back to storefront
          </Link>
        </p>
      </div>
    </div>
  )
}
