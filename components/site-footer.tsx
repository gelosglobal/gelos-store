'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import {
  footerLinkGroups,
  footerPaymentMethods,
  footerSocialLinks,
} from '@/lib/footer-links'
import { trackSubscribe } from '@/lib/meta-pixel'
import { cn } from '@/lib/utils'

function GelosLogo({
  className,
  height = 36,
}: {
  className?: string
  height?: number
}) {
  return (
    <Image
      src="/gelos/gelos-logo.png"
      alt="Gelos"
      width={Math.round(height * (140 / 36))}
      height={height}
      className={cn('w-auto object-contain object-left', className)}
      style={{ width: 'auto', height }}
    />
  )
}

function SocialIcon({ type }: { type: (typeof footerSocialLinks)[number]['icon'] }) {
  const className = 'size-4 text-white'

  switch (type) {
    case 'instagram':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6.5-.9a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2z" />
        </svg>
      )
    case 'tiktok':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M16.5 3h-2.2c.2 1.6 1.4 3.1 3 3.6V8c-1.4-.1-2.7-.6-3.8-1.4v7.1a5.4 5.4 0 1 1-4.9-5.4v2.2a3.2 3.2 0 1 0 2.3 3.1V3z" />
        </svg>
      )
    case 'facebook':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M13.5 8.5V6.7c0-.8.6-1 1-1h1.7V3h-2.4C11.8 3 10.5 4.5 10.5 6.4V8.5H8v2.7h2.5V21h2.9v-9.8H17l.5-2.7h-3z" />
        </svg>
      )
  }
}

function FooterLinkColumn({
  title,
  links,
}: {
  title: string
  links: { label: string; href: string }[]
}) {
  return (
    <div className="min-w-0">
      <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-white sm:text-xs">
        {title}
      </h3>
      <ul className="mt-2 space-y-1">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-[12px] leading-snug text-white/50 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function FooterStoreLocatorBanner({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        'relative shrink-0 self-center overflow-hidden rounded-2xl bg-white shadow-lg shadow-black/30 ring-1 ring-white/10',
        'w-full lg:w-[26rem] xl:w-[28rem]',
        className,
      )}
    >
      <div className="relative h-[9.75rem] sm:h-[10.5rem]">
        <div className="relative z-10 flex h-full w-[40%] flex-col justify-center px-3 py-3 sm:px-3.5">
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#F0FDF4]/50 via-white to-white"
            aria-hidden
          />
          <h2 className="relative text-[13px] font-bold leading-snug text-neutral-950 sm:text-[15px]">
            <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
              <span>Find</span>
              <span className="font-black tracking-tight">GELOS</span>
              <span>Near You</span>
            </span>
          </h2>
          <div className="relative mt-1.5 h-0.5 w-7 rounded-full bg-[#84CC16]" aria-hidden />
          <p className="relative mt-2 max-w-[9.5rem] text-[10px] leading-snug text-neutral-600 sm:text-[11px]">
            Available in leading pharmacies and stores across Ghana.
          </p>
          <Link
            href="/find-a-store"
            className="relative mt-2.5 inline-flex w-fit items-center gap-1.5 rounded-full bg-[#84CC16] px-3.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-neutral-950 shadow-sm transition-colors hover:bg-[#73b512] sm:px-4 sm:py-2 sm:text-[10px]"
          >
            Find a store
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <div className="absolute inset-y-0 right-0 w-[62%]">
          <Image
            src="/gelos/footer-find-store.png"
            alt="GELOS retail store"
            fill
            priority={false}
            className="object-cover object-center"
            sizes="(max-width: 1024px) 50vw, 300px"
          />
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-14 bg-gradient-to-r from-white via-white/85 to-transparent sm:w-16"
            aria-hidden
          />
        </div>
      </div>
    </aside>
  )
}

export function SiteFooter() {
  const [newsletterEmail, setNewsletterEmail] = useState('')

  const onNewsletterSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!newsletterEmail.trim()) return
    trackSubscribe()
    setNewsletterEmail('')
  }

  return (
    <footer className="bg-black">
      <div className="mx-auto max-w-[100rem] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="relative overflow-hidden rounded-[1.75rem] bg-black text-white ring-1 ring-white/10">
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-fuchsia-600/15 via-violet-600/10 to-transparent"
            aria-hidden
          />

          <div className="relative p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-3 xl:gap-4">
              <div className="shrink-0">
                <Link href="/" className="inline-block">
                  <GelosLogo height={44} className="h-10 sm:h-11" />
                </Link>
                <p className="mt-2 text-sm text-white/75">
                  Stronger smiles. Better days.
                </p>
              </div>

              <div className="w-full shrink-0 lg:max-w-[13rem]">
                <h2 className="text-sm font-semibold text-white">
                  Subscribe to our newsletter
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-white/45">
                  Get the latest updates, new flavors and exclusive offers.
                </p>
                <form className="relative mt-3" onSubmit={onNewsletterSubmit}>
                  <label htmlFor="footer-newsletter-email" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="footer-newsletter-email"
                    type="email"
                    placeholder="Enter your email"
                    value={newsletterEmail}
                    onChange={(event) => setNewsletterEmail(event.target.value)}
                    className="w-full rounded-full bg-white py-2.5 pl-4 pr-11 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#84CC16]"
                  />
                  <button
                    type="submit"
                    aria-label="Subscribe"
                    className="absolute right-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-[#84CC16] text-neutral-950 transition-colors hover:bg-[#73b512]"
                  >
                    <ArrowRight className="size-3.5" />
                  </button>
                </form>
              </div>

              <div
                className="shrink-0 bg-white/10 lg:mx-1 lg:h-auto lg:w-px lg:self-stretch h-px w-full"
                aria-hidden
              />

              <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-4 lg:flex lg:gap-3 xl:gap-4">
                {footerLinkGroups.map((group) => (
                  <FooterLinkColumn
                    key={group.title}
                    title={group.title}
                    links={group.links}
                  />
                ))}
              </div>

              <FooterStoreLocatorBanner className="lg:ml-auto" />
            </div>

            <div className="mt-6 flex flex-col gap-4 border-t border-white/10 pt-5 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
              <p className="shrink-0 text-xs text-white/40">
                &copy; 2026 GELOS Global. All rights reserved.
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-3 text-xs text-white/40 lg:justify-end lg:gap-x-5">
                <Link href="/contact" className="transition-colors hover:text-white">
                  Terms &amp; Conditions
                </Link>
                <Link href="/contact" className="transition-colors hover:text-white">
                  Privacy Policy
                </Link>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">
                    Follow us
                  </span>
                  <div className="flex gap-1.5">
                    {footerSocialLinks.map((social) => (
                      <Link
                        key={social.label}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={social.label}
                        className={cn(
                          'flex size-7 items-center justify-center rounded-full transition-transform hover:scale-105',
                          social.className,
                        )}
                      >
                        <SocialIcon type={social.icon} />
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">
                    We accept
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {footerPaymentMethods.map((method) => (
                      <span
                        key={method}
                        className="rounded bg-white px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-neutral-800"
                      >
                        {method}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
