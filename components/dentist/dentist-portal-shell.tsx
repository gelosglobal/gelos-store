'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, Stethoscope } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { dentistPartners } from '@/lib/gelos-ai/dentists'

const clinic = dentistPartners[0]

export function DentistPortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLogin = pathname === '/dentist/login'

  if (isLogin) {
    return <>{children}</>
  }

  const onLogout = async () => {
    await fetch('/api/dentist/auth/logout', { method: 'POST' })
    window.location.href = '/dentist/login'
  }

  return (
    <div className="min-h-screen bg-[#f4f8fc] text-neutral-950">
      <header className="border-b border-sky-100 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/dentist" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 text-white shadow-sm">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-semibold text-neutral-950">
                {clinic?.clinic ?? "Mark's Dental Clinic"}
              </p>
              <p className="text-xs text-neutral-500">
                {clinic?.name ?? 'Dr. Mark Nartey'} · Appointment desk
              </p>
            </div>
          </Link>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full border-sky-200"
            onClick={() => void onLogout()}
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  )
}
