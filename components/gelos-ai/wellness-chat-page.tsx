'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ClipboardList, ScanFace, Sparkles, Stethoscope } from 'lucide-react'
import { AiChatPanel } from '@/components/gelos-ai/ai-chat-panel'
import { SiteFooter } from '@/components/site-footer'
import { cn } from '@/lib/utils'

const actionCards = [
  {
    href: '/smile-test',
    icon: ClipboardList,
    title: 'Smile test',
    description: 'Personalized routine & product picks.',
  },
  {
    href: '/ai?tab=scan',
    icon: ScanFace,
    title: 'Smile scan',
    description: 'AI smile insights from a photo.',
  },
  {
    href: '/book-dentist',
    icon: Stethoscope,
    title: 'Book dentist',
    description: "Mark's Dental Clinic, Ridge Accra.",
  },
] as const

export function WellnessChatPage() {
  return (
    <div className="relative bg-white text-foreground">
      <div className="pointer-events-none absolute -top-16 right-0 h-48 w-48 rounded-full bg-[#F0FDF4]/80 blur-[80px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-40 w-40 rounded-full bg-[#F0FDF4]/70 blur-[70px]" />

      <div className="relative mx-auto w-full max-w-4xl px-4 py-4 pb-10 sm:px-6 sm:py-5 sm:pb-14">
        <header className="flex shrink-0 items-center justify-between gap-4">
          <Link
            href="/ai"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-950"
          >
            <ArrowLeft className="size-4" />
            Gelos AI
          </Link>
          {/* <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-[#84CC16]">
              <Sparkles className="size-3.5 text-neutral-950" />
            </span>
            <span className="text-sm font-semibold text-neutral-950">Wellness expert</span>
          </div> */}
        </header>

        <div className="mt-4 flex shrink-0 items-center justify-center gap-3 sm:gap-4">
          <div className="relative h-14 w-14 shrink-0 sm:h-16 sm:w-16">
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(132,204,22,0.14)_0%,transparent_70%)]" />
            <Image
              src="/gelos/dentist.png"
              alt="Gelos wellness expert"
              fill
              priority
              className="object-contain object-bottom"
              sizes="64px"
            />
          </div>
          <div className="text-left">
            <h1 className="text-xl font-bold tracking-tight text-neutral-950 sm:text-2xl">
              Welcome back!
            </h1>
            <p className="mt-0.5 max-w-xs text-xs leading-snug text-neutral-600 sm:text-sm">
              Ask about products, flavors, whitening, or your smile routine.
            </p>
          </div>
        </div>

        <div className="mt-4">
          <AiChatPanel variant="wellness" fullPage />
        </div>

        <div className="mt-3 grid shrink-0 grid-cols-3 gap-2 sm:gap-3">
          {actionCards.map(({ href, icon: Icon, title, description }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'group rounded-xl border border-neutral-200 bg-white p-2.5 shadow-sm transition-all sm:p-3',
                'hover:border-[#84CC16]/40 hover:shadow-md',
              )}
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-[#F0FDF4] text-[#65A30D] transition-colors group-hover:bg-[#DCFCE7] sm:size-9">
                <Icon className="size-4" />
              </span>
              <h2 className="mt-2 text-[11px] font-semibold leading-tight text-neutral-950 sm:text-xs">
                {title}
              </h2>
              <p className="mt-1 hidden text-[10px] leading-snug text-neutral-500 sm:block">
                {description}
              </p>
            </Link>
          ))}
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
