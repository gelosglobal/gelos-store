'use client'

import type { ComponentType } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  ExternalLink,
  LayoutDashboard,
  Link2,
  LogOut,
  Menu,
  Receipt,
  Settings,
  X,
} from 'lucide-react'
import { signOut } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const AFFILIATE_PROFILE_IMAGE = '/Prata.jpeg'

type NavItem = {
  href: string
  label: string
  icon: ComponentType<{ className?: string }>
  external?: boolean
  match?: 'exact' | 'settings' | 'hash'
  hash?: string
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/affiliate/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    match: 'exact',
  },
  {
    href: '/affiliate/dashboard#referral',
    label: 'Referral link',
    icon: Link2,
    match: 'hash',
    hash: '#referral',
  },
  {
    href: '/affiliate/dashboard#orders',
    label: 'Orders',
    icon: Receipt,
    match: 'hash',
    hash: '#orders',
  },
  {
    href: '/affiliate/dashboard/settings',
    label: 'Settings',
    icon: Settings,
    match: 'settings',
  },
  {
    href: '/shop',
    label: 'Shop',
    icon: ExternalLink,
    external: true,
  },
]

function isNavActive(
  pathname: string,
  hash: string,
  item: NavItem,
): boolean {
  if (item.match === 'settings') {
    return pathname.startsWith('/affiliate/dashboard/settings')
  }
  if (item.match === 'hash') {
    return (
      pathname === '/affiliate/dashboard' && hash === (item.hash ?? '')
    )
  }
  if (item.match === 'exact') {
    return pathname === '/affiliate/dashboard' && (!hash || hash === '')
  }
  return false
}

function SidebarNav({
  pathname,
  hash,
  onNavigate,
}: {
  pathname: string
  hash: string
  onNavigate?: () => void
}) {
  return (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const active = isNavActive(pathname, hash, item)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
              active
                ? 'bg-neutral-950 text-white'
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="flex-1">{item.label}</span>
            {item.external ? (
              <ExternalLink className="h-3.5 w-3.5 opacity-60" aria-hidden />
            ) : null}
          </Link>
        )
      })}
    </nav>
  )
}

export function AffiliatePortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [hash, setHash] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const syncHash = () => setHash(window.location.hash)
    syncHash()
    window.addEventListener('hashchange', syncHash)
    return () => window.removeEventListener('hashchange', syncHash)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/affiliate/login'
  }

  const closeMobileMenu = () => setMobileOpen(false)

  const sidebarContent = (
    <>
      <div className="border-b border-neutral-200 px-4 py-5">
        <Link
          href="/affiliate/dashboard"
          onClick={closeMobileMenu}
          className="flex items-center gap-3"
        >
          <Image
            src={AFFILIATE_PROFILE_IMAGE}
            alt="Affiliate profile"
            width={44}
            height={44}
            className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-neutral-100"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-neutral-950">
              Partner dashboard
            </p>
            <p className="truncate text-xs text-neutral-500">Gelos affiliates</p>
          </div>
        </Link>
      </div>

      <SidebarNav
        pathname={pathname ?? ''}
        hash={hash}
        onNavigate={closeMobileMenu}
      />

      <div className="border-t border-neutral-200 p-3">
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2 rounded-xl"
          onClick={() => void handleSignOut()}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </>
  )

  return (
    <div className="flex min-h-screen bg-neutral-50 text-neutral-950">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-neutral-200 bg-white md:flex">
        {sidebarContent}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={closeMobileMenu}
            aria-label="Close menu"
          />
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col border-r border-neutral-200 bg-white shadow-xl">
            <button
              type="button"
              onClick={closeMobileMenu}
              className="absolute top-4 right-4 rounded-lg p-2 text-neutral-500 hover:bg-neutral-100"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b border-neutral-200 bg-white/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-white/80 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="rounded-lg p-2 text-neutral-700 hover:bg-neutral-100 md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link href="/affiliate/dashboard" className="flex min-w-0 items-center gap-2.5 md:hidden">
              <Image
                src="/gelos/gelos-logo.png"
                alt="Gelos"
                width={96}
                height={28}
                className="h-6 w-auto shrink-0"
              />
              <span className="truncate text-sm font-semibold text-neutral-950">
                Partners
              </span>
            </Link>
            <p className="hidden text-sm font-medium text-neutral-500 md:block">
              Gelos Affiliate Portal
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Image
              src={AFFILIATE_PROFILE_IMAGE}
              alt="Affiliate profile"
              width={36}
              height={36}
              className="h-9 w-9 rounded-full object-cover ring-2 ring-neutral-100"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="hidden rounded-full sm:inline-flex"
              onClick={() => void handleSignOut()}
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
