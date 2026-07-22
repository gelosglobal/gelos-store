'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import {
  footerLinkGroups,
  footerSocialLinks,
} from '@/lib/footer-links'
import { paymentProviderLogos } from '@/lib/payment-provider-logos'
import { trackLead } from '@/lib/meta-pixel'
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
      <ul className="mt-2.5 space-y-1.5">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="inline-block text-[12px] leading-snug text-white/50 transition-colors hover:text-white sm:text-[13px]"
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
        'relative shrink-0 overflow-hidden rounded-2xl bg-white shadow-lg shadow-black/30 ring-1 ring-white/10',
        'w-full lg:max-w-[26rem] xl:max-w-none xl:w-full',
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
    // Newsletter signup is a Lead, not Meta's Subscribe (paid subscription) event.
    // Subscribe with a fixed value triggers Meta's "same price" diagnostics.
    trackLead('Newsletter signup')
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
            <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_28rem] xl:items-start xl:gap-8">
              <div className="flex min-w-0 flex-col gap-8 lg:flex-row lg:items-start lg:gap-6">
                <div className="shrink-0">
                  <Link href="/" className="inline-block">
                    <GelosLogo height={44} className="h-10 sm:h-11" />
                  </Link>
                  <p className="mt-2 text-sm text-white/75">
                    Stronger smiles. Better days.
                  </p>
                </div>

                <div className="w-full min-w-0 shrink-0 sm:max-w-[13rem] lg:w-[13rem]">
                  <h2 className="text-sm font-semibold text-white">
                    Subscribe to our newsletter
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-white/45">
                    Get the latest updates, new flavors and exclusive offers.
                  </p>
                  <form
                    className="relative mt-3 min-w-0 max-w-full"
                    onSubmit={onNewsletterSubmit}
                  >
                    <label htmlFor="footer-newsletter-email" className="sr-only">
                      Email address
                    </label>
                    <input
                      id="footer-newsletter-email"
                      type="email"
                      placeholder="Enter your email"
                      value={newsletterEmail}
                      onChange={(event) => setNewsletterEmail(event.target.value)}
                      className="box-border w-full max-w-full rounded-full bg-white py-2.5 pl-4 pr-11 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#84CC16]"
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
                  className="hidden shrink-0 bg-white/10 lg:mx-1 lg:block lg:w-px lg:self-stretch"
                  aria-hidden
                />

                <div className="grid min-w-0 shrink-0 grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-3 sm:gap-x-6 lg:gap-x-8">
                  {footerLinkGroups
                    .filter((group) => !group.hidden)
                    .map((group) => (
                      <FooterLinkColumn
                        key={group.title}
                        title={group.title}
                        links={group.links}
                      />
                    ))}
                </div>
              </div>

              <FooterStoreLocatorBanner className="w-full max-w-full justify-self-stretch xl:justify-self-end" />
            </div>

            <div className="mt-6 flex flex-col gap-4 border-t border-white/10 pt-5 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
              <p className="shrink-0 text-xs text-white/40">
                &copy; 2026 GELOS Global. All rights reserved.
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-3 text-xs text-white/40 lg:justify-end lg:gap-x-5">
                <Link href="/terms" className="transition-colors hover:text-white">
                  Terms &amp; Conditions
                </Link>
                <Link href="/privacy" className="transition-colors hover:text-white">
                  Privacy Policy
                </Link>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">
                    Follow us
                  </span>
                  <div className="flex gap-1.5">
                    {footerSocialLinks.map((social) => {
                      const isTikTok = social.label === 'TikTok'
                      return (
                        <Link
                          key={social.label}
                          href={social.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={social.label}
                          className={cn(
                            'block size-7 overflow-hidden rounded-full transition-transform hover:scale-105',
                            isTikTok && 'bg-white p-0.5',
                          )}
                        >
                          <Image
                            src={social.src}
                            alt=""
                            width={28}
                            height={28}
                            className={cn(
                              'size-full',
                              isTikTok ? 'object-contain' : 'object-cover',
                            )}
                          />
                        </Link>
                      )
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">
                    We accept
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {paymentProviderLogos.map((method) => (
                      <div
                        key={method.id}
                        className="flex h-7 min-w-[2.75rem] items-center justify-center rounded bg-white px-1.5"
                      >
                        <Image
                          src={method.src}
                          alt={method.label}
                          width={72}
                          height={22}
                          className={cn('h-auto w-auto object-contain', method.className)}
                        />
                      </div>
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
