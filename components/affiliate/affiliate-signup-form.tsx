'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { signIn } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function AffiliateSignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [name, setName] = useState('')
  const [email, setEmail] = useState(searchParams.get('email')?.trim() ?? '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (loading) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/affiliate/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          name: name.trim() || undefined,
        }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Could not create account.')
        return
      }

      const signInResult = await signIn.email({
        email: email.trim().toLowerCase(),
        password,
      })

      if (signInResult.error) {
        setError(
          'Account created, but sign in failed. Please use the sign in page.',
        )
        return
      }

      router.replace('/affiliate/dashboard')
      router.refresh()
    } catch {
      setError('Could not create account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12">
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
            Create affiliate account
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Use the email address Gelos invited you with to set up secure access
            to your dashboard.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="affiliate-signup-name">Full name</Label>
            <Input
              id="affiliate-signup-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ama Mensah"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="affiliate-signup-email">Invited email</Label>
            <Input
              id="affiliate-signup-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="affiliate-signup-password">Password</Label>
            <div className="relative">
              <Input
                id="affiliate-signup-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="pr-10"
                minLength={8}
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
            <p className="text-xs text-neutral-500">At least 8 characters.</p>
          </div>

          {error ? (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            className="h-11 w-full rounded-full bg-neutral-950 hover:bg-neutral-800"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Create account'
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          Already have an account?{' '}
          <Link
            href="/affiliate/login"
            className="font-medium text-neutral-800 hover:underline"
          >
            Sign in
          </Link>
        </p>

        <p className="mt-3 text-center text-sm text-neutral-500">
          <Link href="/" className="font-medium text-neutral-800 hover:underline">
            Back to storefront
          </Link>
        </p>
      </div>
    </div>
  )
}
