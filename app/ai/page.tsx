'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowRight,
  ClipboardList,
  ScanFace,
  Sparkles,
  X,
} from 'lucide-react'
import { Suspense, useEffect, useRef, useState } from 'react'
import { ScanSmilePanel } from '@/components/gelos-ai/scan-smile-panel'
import { SiteFooter } from '@/components/site-footer'
import { cn } from '@/lib/utils'

const howItWorks = [
  {
    step: '1',
    title: 'Pick your path',
    description: 'Take the smile test or scan a photo to get started.',
  },
  {
    step: '2',
    title: 'Get personalized guidance',
    description: 'Routines, product matches, and honest smile insights tailored to you.',
  },
  {
    step: '3',
    title: 'Take the next step',
    description: 'Shop Gelos picks and build a bundle matched to your results.',
  },
] as const

type AiTool = {
  id: string
  title: string
  tagline: string
  meta: string
  cta: string
  icon: typeof ClipboardList
  href?: string
  opensScan?: boolean
}

const aiTools: AiTool[] = [
  {
    id: 'smile-test',
    href: '/smile-test',
    icon: ClipboardList,
    title: 'Smile test',
    tagline: 'Answer quick questions for your score, routine, and product picks.',
    meta: '~2 min',
    cta: 'Start test',
  },
  {
    id: 'smile-scan',
    opensScan: true,
    icon: ScanFace,
    title: 'Smile scan',
    tagline: 'Upload a photo for AI scores, tips, and matched Gelos products.',
    meta: 'Photo',
    cta: 'Open scan',
  },
]

function GelosAiPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlTab = searchParams.get('tab')
  const [showScan, setShowScan] = useState(urlTab === 'scan')
  const scanSectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (urlTab === 'dentist') {
      router.replace('/book-dentist')
      return
    }
    if (urlTab === 'chat') {
      router.replace('/ai/chat')
      return
    }
    setShowScan(urlTab === 'scan')
  }, [router, urlTab])

  useEffect(() => {
    if (!showScan || urlTab !== 'scan') return
    const frame = requestAnimationFrame(() => {
      scanSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    return () => cancelAnimationFrame(frame)
  }, [showScan, urlTab])

  const openSmileScan = () => {
    setShowScan(true)
    router.replace('/ai?tab=scan', { scroll: false })
  }

  const closeSmileScan = () => {
    setShowScan(false)
    router.replace('/ai', { scroll: false })
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden border-b border-neutral-200 bg-neutral-950 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(132,204,22,0.18),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(79,108,247,0.16),transparent_40%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-[#84CC16]" />
              Gelos Smile AI
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Your personal smile care assistant
            </h1>
            <p className="mt-4 text-base text-neutral-300 sm:text-lg">
              Take the smile test for a personalized routine, or scan your smile for a visual
              AI report. Product questions?{' '}
              <Link
                href="/ai/chat"
                className="font-medium text-white underline-offset-4 hover:underline"
              >
                Chat with our wellness expert
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-12">
        <p className="mx-auto mb-6 max-w-lg text-center text-sm text-neutral-500">
          Both tools are free. Pick one to get started.
        </p>

        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 sm:gap-8 lg:max-w-6xl">
          {aiTools.map((tool) => {
            const Icon = tool.icon
            const isScanActive = tool.opensScan && showScan
            const ctaLabel = tool.opensScan && showScan ? 'Open below' : tool.cta

            return (
              <article
                key={tool.id}
                className={cn(
                  'flex min-h-[22rem] flex-col rounded-[2rem] border bg-white p-8 text-left sm:min-h-[24rem] sm:p-10',
                  isScanActive
                    ? 'border-[#84CC16] bg-[#FAFFF5] shadow-sm'
                    : 'border-neutral-200 shadow-sm',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={cn(
                      'flex size-14 items-center justify-center rounded-2xl sm:size-16',
                      isScanActive
                        ? 'bg-[#84CC16] text-neutral-950'
                        : 'bg-[#F0FDF4] text-[#65A30D]',
                    )}
                  >
                    <Icon className="size-7 sm:size-8" strokeWidth={2} />
                  </span>
                  <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium tracking-wide text-neutral-500 uppercase">
                    {tool.meta}
                  </span>
                </div>

                <h3 className="mt-6 text-2xl font-bold text-neutral-950 sm:text-[1.75rem]">
                  {tool.title}
                </h3>
                <p className="mt-3 flex-1 text-base leading-relaxed text-neutral-600 sm:text-lg">
                  {tool.tagline}
                </p>

                {tool.href ? (
                  <Link
                    href={tool.href}
                    className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#84CC16] px-6 py-4 text-base font-semibold text-neutral-950 transition-colors hover:bg-[#73b512]"
                  >
                    {ctaLabel}
                    <ArrowRight className="size-5" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={openSmileScan}
                    className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#84CC16] px-6 py-4 text-base font-semibold text-neutral-950 transition-colors hover:bg-[#73b512]"
                  >
                    {ctaLabel}
                    <ArrowRight className="size-5" />
                  </button>
                )}
              </article>
            )
          })}
        </div>

        <div className="mt-12 rounded-[1.75rem] border border-neutral-200 bg-[#FAFCFE] p-6 sm:p-8">
          <h2 className="text-center text-lg font-bold text-neutral-950 sm:text-xl">
            How Gelos Smile AI works
          </h2>
          <ol className="mt-6 grid gap-6 sm:grid-cols-3">
            {howItWorks.map(({ step, title, description }) => (
              <li key={step} className="text-center sm:text-left">
                <span className="inline-flex size-8 items-center justify-center rounded-full bg-[#84CC16] text-sm font-bold text-neutral-950">
                  {step}
                </span>
                <h3 className="mt-3 text-sm font-semibold text-neutral-950">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-neutral-600">{description}</p>
              </li>
            ))}
          </ol>
        </div>

        {showScan ? (
          <div
            ref={scanSectionRef}
            className="mt-12 scroll-mt-24 rounded-[1.75rem] border border-neutral-200 bg-white p-5 shadow-sm sm:p-7"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#65A30D]">
                  Smile scan
                </p>
                <h2 className="mt-1 text-2xl font-bold text-neutral-950">Scan your smile</h2>
                <p className="mt-1 max-w-2xl text-sm text-neutral-600">
                  Upload or capture a clear front-facing photo. We&apos;ll only score what we can
                  see clearly — no guessing from blurry images.
                </p>
              </div>
              <button
                type="button"
                onClick={closeSmileScan}
                className="flex size-9 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-950"
                aria-label="Close smile scan"
              >
                <X className="size-4" />
              </button>
            </div>
            <ScanSmilePanel />
          </div>
        ) : null}
      </section>

      <SiteFooter />
    </div>
  )
}

export default function GelosAiPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
          Loading Gelos AI…
        </div>
      }
    >
      <GelosAiPageContent />
    </Suspense>
  )
}
