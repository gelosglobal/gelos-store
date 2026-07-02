'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, ShoppingCart, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { AnnouncementBar } from '@/components/announcement-bar'
import { LocationSelector } from '@/components/location-selector'
import { StorefrontAdminLink } from '@/components/storefront-admin-link'
import { MegaMenu } from '@/components/mega-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useCart } from '@/components/cart-provider'
import { mainNavLinks, navItemClassName } from '@/lib/nav-config'
import { isStorefrontChromeHidden } from '@/lib/dentist/portal'
import { cn } from '@/lib/utils'

export function SiteNavbar() {
  const pathname = usePathname()
  const { itemCount, isHydrated } = useCart()

  if (isStorefrontChromeHidden(pathname)) {
    return null
  }
  const [megaOpen, setMegaOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const openMega = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setMegaOpen(true)
  }

  const scheduleCloseMega = () => {
    closeTimer.current = setTimeout(() => setMegaOpen(false), 150)
  }

  const cancelCloseMega = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }

  const closeMega = () => {
    cancelCloseMega()
    setMegaOpen(false)
  }

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current)
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMega()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="sticky top-0 z-50">
      <AnnouncementBar />
      <header className="relative border-b border-neutral-200/80 bg-white/95 backdrop-blur-md">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center gap-4">
          <Link href="/" className="shrink-0" onMouseEnter={closeMega}>
            <Image
              src="/gelos/gelos-logo.png"
              alt="Gelos"
              width={140}
              height={36}
              className="h-7 w-auto sm:h-8"
              style={{ width: 'auto' }}
              priority
            />
          </Link>

          <nav className="font-nav hidden flex-1 items-center justify-center gap-0.5 lg:flex">
            {mainNavLinks.map((item) => {
              const Icon = item.icon
              if (item.opensMegaMenu) {
                return (
                  <div
                    key={item.id}
                    className="relative"
                    onMouseEnter={openMega}
                    onMouseLeave={scheduleCloseMega}
                  >
                    <Link
                      href={item.href}
                      onClick={closeMega}
                      className={cn(
                        navItemClassName,
                        megaOpen
                          ? 'bg-neutral-100 text-foreground'
                          : 'text-foreground/80 hover:bg-neutral-50 hover:text-foreground',
                      )}
                      aria-expanded={megaOpen}
                      aria-haspopup="true"
                    >
                      <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                      {item.label}
                    </Link>
                  </div>
                )
              }
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onMouseEnter={closeMega}
                  className={cn(
                    navItemClassName,
                    'text-foreground/80 hover:bg-neutral-50 hover:text-foreground',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div
            className="ml-auto flex items-center gap-1 sm:gap-2"
            onMouseEnter={closeMega}
          >
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger
                className="inline-flex p-2 lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </SheetTrigger>
              <SheetContent side="left" className="w-full max-w-sm p-0">
                <SheetHeader className="items-start border-b border-neutral-100 px-4 py-4">
                  <SheetTitle className="sr-only">Menu</SheetTitle>
                  <Link
                    href="/"
                    onClick={() => setMobileOpen(false)}
                    className="inline-block w-fit shrink-0"
                  >
                    <Image
                      src="/gelos/gelos-logo.png"
                      alt="Gelos"
                      width={140}
                      height={36}
                      className="h-7 w-auto max-w-[140px] object-contain object-left sm:h-8"
                      style={{ width: 'auto' }}
                    />
                  </Link>
                </SheetHeader>
                <div className="overflow-y-auto p-4 font-nav">
                  <div className="mb-4 border-b border-neutral-100 pb-4">
                    <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Ship to
                    </p>
                    <LocationSelector showFullLabel className="w-full" />
                  </div>
                  <div className="mb-4 flex flex-col gap-1 border-b border-neutral-100 pb-4">
                    <StorefrontAdminLink
                      showLabel
                      className="w-full px-2 py-2.5 hover:bg-neutral-50"
                      onNavigate={() => setMobileOpen(false)}
                    />
                    {mainNavLinks.map((item) => {
                        const Icon = item.icon
                        return (
                          <Link
                            key={item.id}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                              navItemClassName,
                              'w-full text-foreground/90 hover:bg-neutral-50',
                            )}
                          >
                            <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                            {item.label}
                          </Link>
                        )
                      })}
                  </div>
                  <MegaMenu onNavigate={() => setMobileOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>

            <div className="hidden sm:block">
              <LocationSelector />
            </div>

            {mainNavLinks
              .filter((item) => item.id === 'bundles')
              .map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={cn(
                      navItemClassName,
                      'hidden text-foreground/80 hover:text-foreground sm:inline-flex lg:hidden',
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                    {item.label}
                  </Link>
                )
              })}
            <StorefrontAdminLink />
            <Link
              href="/cart"
              className="relative p-2 text-foreground transition-opacity hover:opacity-70"
              aria-label="Cart"
            >
              <ShoppingCart className="h-5 w-5" strokeWidth={1.75} />
              {isHydrated && itemCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#84CC16] px-1 text-[10px] font-bold text-neutral-900">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>
            {megaOpen && (
              <button
                type="button"
                className="hidden p-2 lg:inline-flex"
                onClick={closeMega}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {megaOpen && (
        <div
          className="absolute left-0 right-0 top-full hidden lg:block"
          onMouseEnter={cancelCloseMega}
          onMouseLeave={scheduleCloseMega}
        >
          <div className="h-3 w-full" aria-hidden />
          <div className="px-4 pb-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <MegaMenu onNavigate={closeMega} />
            </div>
          </div>
        </div>
      )}

      {megaOpen && (
        <button
          type="button"
          className="fixed inset-0 top-[6.5rem] z-[-1] hidden bg-black/5 lg:block"
          aria-label="Close menu backdrop"
          onClick={closeMega}
        />
      )}
    </header>
    </div>
  )
}
