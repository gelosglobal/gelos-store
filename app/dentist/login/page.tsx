'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, Loader2, Stethoscope } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CLINIC_HOURS_LABEL } from '@/lib/gelos-ai/dentist-schedule'
import { dentistPartners } from '@/lib/gelos-ai/dentists'

const clinic = dentistPartners[0]

export default function DentistLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/dentist/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = (await res.json()) as { error?: string }

      if (!res.ok) {
        throw new Error(data.error ?? 'Login failed.')
      }

      router.replace('/dentist')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f8fc] px-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-sky-600 to-sky-700 px-8 py-7 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-sky-100">Appointment desk</p>
              <h1 className="text-xl font-semibold">{clinic?.clinic}</h1>
            </div>
          </div>
          <p className="mt-4 text-sm text-sky-100">{clinic?.name}</p>
        </div>

        <div className="p-8">
          <div className="mb-6 flex items-start gap-2 rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-900">
            <Clock className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{CLINIC_HOURS_LABEL}</span>
          </div>

          <p className="mb-6 text-sm text-neutral-600">
            Sign in to review patient requests, confirm appointments, and manage your schedule.
          </p>

          <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
            <div>
              <Label htmlFor="dentist-password">Password</Label>
              <Input
                id="dentist-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="mt-1.5 rounded-xl border-sky-100"
              />
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-sky-600 hover:bg-sky-700"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign in'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
