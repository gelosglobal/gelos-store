'use client'

import type { ComponentType } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  LayoutGrid,
  ShoppingCart,
  Users,
  BarChart3,
  BadgePercent,
  ScanFace,
  Share2,
  Inbox,
  Mail,
  Settings,
  ExternalLink,
  Menu,
  X,
  LogOut,
} from 'lucide-react'
import { useState } from 'react'
import { signOut, useSession } from '@/lib/auth-client'
import { productTagDefinitions } from '@/lib/product-tags'
import { cn } from '@/lib/utils'

type NavItem = {
  href: string
  label: string
  icon: ComponentType<{ className?: string }>
  children?: { href: string; label: string }[]
}

type NavSection = {
  title: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    title: 'Overview',
    items: [{ href: '/admin', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'Content',
    items: [
      { href: '/admin/products', label: 'Products', icon: Package },
      {
        href: '/admin/collections',
        label: 'Collections',
        icon: LayoutGrid,
        children: productTagDefinitions.map((tag) => ({
          href: `/admin/collections/${tag.id}`,
          label: tag.label,
        })),
      },
    ],
  },
  {
    title: 'Store',
    items: [
      { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
      { href: '/admin/checkouts', label: 'Checkouts', icon: BadgePercent },
      { href: '/admin/customers', label: 'Customers', icon: Users },
      { href: '/admin/inbox', label: 'Inbox', icon: Inbox },
      { href: '/admin/affiliates', label: 'Affiliates', icon: Share2 },
      { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
      { href: '/admin/smile-scans', label: 'Smile scans', icon: ScanFace },
    ],
  },
  {
    title: 'System',
    items: [
      { href: '/admin/email', label: 'Email', icon: Mail },
      { href: '/admin/settings', label: 'Settings', icon: Settings },
    ],
  },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const isLoginPage = pathname === '/admin/login'

  const handleSignOut = async () => {
    if (signingOut) return
    setSigningOut(true)
    try {
      await signOut()
      router.replace('/admin/login')
      router.refresh()
    } finally {
      setSigningOut(false)
    }
  }

  if (isLoginPage) {
    return children
  }

  const userInitial =
    session?.user?.name?.trim().charAt(0).toUpperCase() ||
    session?.user?.email?.trim().charAt(0).toUpperCase() ||
    'A'

  const isActive = (href: string, hasChildren?: boolean) => {
    if (href === '/admin') return pathname === '/admin'
    if (hasChildren) return pathname.startsWith(href)
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-5">
        {sidebarOpen && (
          <Link href="/admin" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D4FF59] text-sm font-bold text-neutral-950">
              G
            </span>
            <div>
              <p className="text-sm font-bold text-neutral-950">Gelos</p>
              <p className="text-[10px] font-medium uppercase tracking-widest text-neutral-500">
                CMS
              </p>
            </div>
          </Link>
        )}
        <button
          type="button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hidden rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950 md:inline-flex"
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {navSections.map((section) => (
          <div key={section.title}>
            {sidebarOpen && (
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">
                {section.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href, Boolean(item.children))
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                        active
                          ? 'bg-neutral-950 text-white'
                          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950',
                      )}
                      title={!sidebarOpen ? item.label : undefined}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {sidebarOpen && <span>{item.label}</span>}
                    </Link>
                    {sidebarOpen && item.children && item.children.length > 0 && (
                      <ul className="ml-4 mt-0.5 space-y-0.5 border-l border-neutral-200 pl-2">
                        {item.children.map((child) => {
                          const childActive = pathname === child.href
                          return (
                            <li key={child.href}>
                              <Link
                                href={child.href}
                                onClick={() => setMobileOpen(false)}
                                className={cn(
                                  'block rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                                  childActive
                                    ? 'bg-neutral-100 text-neutral-950'
                                    : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800',
                                )}
                              >
                                {child.label}
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-neutral-200 p-3">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-950',
          )}
        >
          <ExternalLink className="h-4 w-4 shrink-0" />
          {sidebarOpen && <span>View storefront</span>}
        </Link>
      </div>
    </>
  )

  return (
    <div className="flex min-h-screen bg-neutral-100 text-neutral-950">
      <aside
        className={cn(
          'hidden flex-col border-r border-neutral-200 bg-white transition-all duration-300 md:flex',
          sidebarOpen ? 'w-60' : 'w-[4.5rem]',
        )}
      >
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          />
          <aside className="relative flex h-full w-60 flex-col border-r border-neutral-200 bg-white">
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-neutral-200 bg-white px-4 sm:px-6">
          <button
            type="button"
            className="rounded-lg p-2 hover:bg-neutral-100 md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <p className="text-sm font-medium text-neutral-500 md:ml-0">
            Gelos Admin · Content Management
          </p>
          <div className="flex items-center gap-3">
            {session?.user?.name ? (
              <p className="hidden text-sm text-neutral-600 sm:block">{session.user.name}</p>
            ) : null}
            <button
              type="button"
              onClick={() => void handleSignOut()}
              disabled={signingOut}
              className="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-950 sm:inline-flex"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-950 text-sm font-semibold text-white">
              {userInitial}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
