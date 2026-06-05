'use client'

import Link from 'next/link'
import {
  ArrowRight,
  MessageCircle,
  ScanFace,
  Sparkles,
  Stethoscope,
} from 'lucide-react'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { AiChatPanel } from '@/components/gelos-ai/ai-chat-panel'
import { BookDentistPanel } from '@/components/gelos-ai/book-dentist-panel'
import { ScanSmilePanel } from '@/components/gelos-ai/scan-smile-panel'
import { SiteFooter } from '@/components/site-footer'
import { loadActiveTab, saveActiveTab } from '@/lib/gelos-ai/session-storage'
import { cn } from '@/lib/utils'

type AiFeature = 'chat' | 'scan' | 'dentist'

const features = [
  {
    id: 'chat' as const,
    label: 'Ask wellness expert',
    description: 'Product advice, routines & flavor picks',
    icon: MessageCircle,
    accent: 'bg-[#84CC16]',
  },
  {
    id: 'scan' as const,
    label: 'Scan smile',
    description: 'AI-powered smile wellness insights',
    icon: ScanFace,
    accent: 'bg-[#4F6CF7]',
  },
  {
    id: 'dentist' as const,
    label: 'Book a dentist',
    description: 'Partner clinics across Accra',
    icon: Stethoscope,
    accent: 'bg-neutral-950',
  },
]

function parseTab(value: string | null): AiFeature {
  if (value === 'scan' || value === 'dentist' || value === 'chat') return value
  return 'chat'
}

function GelosAiPageContent() {
  const searchParams = useSearchParams()
  const urlTab = searchParams.get('tab')
  const [active, setActive] = useState<AiFeature>(() => {
    if (urlTab) return parseTab(urlTab)
    return loadActiveTab() ?? 'chat'
  })

  useEffect(() => {
    if (urlTab) {
      setActive(parseTab(urlTab))
    }
  }, [urlTab])

  useEffect(() => {
    saveActiveTab(active)
  }, [active])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden border-b border-neutral-200 bg-neutral-950 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(132,204,22,0.18),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(79,108,247,0.16),transparent_40%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-[#84CC16]" />
              Gelos AI Platform
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Your personal smile care assistant
            </h1>
            <p className="mt-4 text-base text-neutral-300 sm:text-lg">
              Chat with Gelos AI, scan your smile for personalized tips, and book trusted
              dentists — all in one place.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 rounded-full bg-[#84CC16] px-5 py-2.5 text-sm font-semibold text-neutral-950 transition-colors hover:bg-[#73b512]"
              >
                Shop smile care
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={() => setActive('scan')}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Try smile scan
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon
            const isActive = active === feature.id
            return (
              <button
                key={feature.id}
                type="button"
                data-ai-tab={feature.id}
                onClick={() => setActive(feature.id)}
                className={cn(
                  'rounded-2xl border p-5 text-left transition-all',
                  isActive
                    ? 'border-neutral-900 bg-white shadow-md'
                    : 'border-neutral-200 bg-neutral-50 hover:border-neutral-300 hover:bg-white',
                )}
              >
                <div
                  className={cn(
                    'mb-4 flex h-11 w-11 items-center justify-center rounded-full text-white',
                    feature.accent,
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold">{feature.label}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
              </button>
            )
          })}
        </div>

        <div className="mt-8">
          {active === 'chat' && (
            <div>
              <div className="mb-4">
                <h2 className="text-2xl font-semibold">Ask a wellness expert</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Get product recommendations, compare flavors, and build your routine.
                </p>
              </div>
              <AiChatPanel />
            </div>
          )}

          {active === 'scan' && (
            <div>
              <div className="mb-4">
                <h2 className="text-2xl font-semibold">Smile scan</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Upload or capture a photo for a visual wellness report and Gelos product picks.
                </p>
              </div>
              <ScanSmilePanel />
            </div>
          )}

          {active === 'dentist' && (
            <div>
              <div className="mb-4">
                <h2 className="text-2xl font-semibold">Book a dentist</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Request an appointment with a Gelos partner clinic in Accra.
                </p>
              </div>
              <BookDentistPanel />
            </div>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}

export default function GelosAiPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
          Loading Gelos AI…
        </div>
      }
    >
      <GelosAiPageContent />
    </Suspense>
  )
}
