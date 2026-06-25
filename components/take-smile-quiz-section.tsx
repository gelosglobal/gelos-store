'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, ClipboardList, Package, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { ScanFaceIcon, type ScanFaceIconHandle } from '@/components/ui/scan-face'
import { ScanTextIcon, type ScanTextIconHandle } from '@/components/ui/scan-text'
import { cn } from '@/lib/utils'

const ANIMATION_LOOP_MS = 2400
const DENTIST_IMAGE = '/gelos/dentist.png'

const howItWorksSteps = [
  {
    icon: ClipboardList,
    title: 'You answer',
    description: 'A few quick questions about your goals, concerns & habits.',
  },
  {
    icon: Sparkles,
    title: 'AI analyzes',
    description: 'Our advanced AI analyzes your answers and creates your unique profile.',
  },
  {
    icon: Package,
    title: 'Get results',
    description: 'Get a personalized routine and product recommendations just for you.',
  },
  {
    icon: TrendingUp,
    title: 'See progress',
    description: 'Track your results and get smarter recommendations over time.',
  },
] as const

export function TakeSmileQuizSection() {
  const router = useRouter()
  const smileTestIconRef = useRef<ScanTextIconHandle>(null)
  const smileScanIconRef = useRef<ScanFaceIconHandle>(null)

  useEffect(() => {
    const play = () => {
      void smileTestIconRef.current?.startAnimation()
      void smileScanIconRef.current?.startAnimation()
    }

    play()
    const interval = window.setInterval(play, ANIMATION_LOOP_MS)
    return () => window.clearInterval(interval)
  }, [])

  return (
    <section
      aria-labelledby="take-smile-quiz-heading"
      className="border-b border-border bg-white py-12 md:py-16 lg:py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#C5DFF0] bg-[#F7FBFE] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#4F7FA3]">
            <span className="size-1.5 rounded-full bg-[#84CC16]" aria-hidden />
            Gelos Smile AI · Free
          </div> */}

          <h2
            id="take-smile-quiz-heading"
            className="mt-5 text-3xl font-bold leading-[1.08] tracking-tight text-neutral-950 sm:text-4xl lg:text-[2.75rem]"
          >
            Find the smile routine made for you
          </h2>

          <p className="mt-4 text-base leading-relaxed text-neutral-600 sm:text-lg">
            Answer a few quick questions and get a personalized routine with product picks
            backed by oral science.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => router.push('/smile-test')}
              className={cn(
                'inline-flex items-center justify-center gap-2.5 rounded-full bg-neutral-950 px-8 py-3.5 text-sm font-semibold text-white transition-colors',
                'hover:bg-neutral-800',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2',
              )}
            >
              <ScanTextIcon
                ref={smileTestIconRef}
                size={18}
                className="shrink-0 text-current"
                aria-hidden
              />
              Start smile test
              <ArrowRight className="size-4" aria-hidden />
            </button>

            <Link
              href="/ai?tab=scan"
              className={cn(
                'inline-flex items-center justify-center gap-2.5 rounded-full bg-[#84CC16] px-8 py-3.5 text-sm font-semibold text-neutral-950 transition-colors',
                'hover:bg-[#73b512]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#84CC16] focus-visible:ring-offset-2',
              )}
            >
              <ScanFaceIcon
                ref={smileScanIconRef}
                size={18}
                className="shrink-0 text-current"
                aria-hidden
              />
              Try smile scan
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>

          <p className="mt-4 text-sm text-neutral-500">
            Takes about 2 minutes · No account required
          </p>
        </div>

        <div className="mt-12 overflow-hidden rounded-[2rem] bg-[#F3F4F6] pt-5 pl-5 pr-5 sm:mt-14 sm:pt-8 sm:pl-8 sm:pr-8 lg:pt-10 lg:pl-10 lg:pr-0">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-stretch lg:gap-10 xl:gap-12">
            <div className="mb-5 rounded-[1.5rem] border border-neutral-200/80 bg-white p-6 shadow-sm sm:mb-8 sm:p-8 lg:mb-10 lg:self-center">
              <h3 className="text-2xl font-bold tracking-tight text-neutral-950 sm:text-[1.75rem]">
                How Smile AI works
              </h3>

              <ol className="mt-6 space-y-6">
                {howItWorksSteps.map(({ icon: StepIcon, title, description }) => (
                  <li key={title} className="flex gap-4">
                    <span
                      className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-950"
                      aria-hidden
                    >
                      <StepIcon className="size-4" strokeWidth={2.25} />
                    </span>
                    <span>
                      <span className="block text-base font-bold text-neutral-950">{title}</span>
                      <span className="mt-1 block text-sm leading-relaxed text-neutral-600">
                        {description}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="relative min-h-[18rem] sm:min-h-[22rem] lg:min-h-[30rem] xl:min-h-[34rem]">
              <div className="absolute inset-x-0 bottom-0 top-0 sm:top-2 lg:top-4 lg:-translate-x-6 xl:-translate-x-8">
                <Image
                  src={DENTIST_IMAGE}
                  alt="Smiling dentist in a white lab coat"
                  fill
                  className="object-contain object-bottom scale-[1.06] origin-bottom lg:scale-[1.1]"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>

              <div className="absolute right-4 bottom-3 z-10 rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 shadow-lg sm:right-6 lg:right-8">
                <div className="flex items-center gap-2">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#84CC16] to-[#65A30D] text-neutral-950">
                    <ShieldCheck className="size-4" aria-hidden />
                  </span>
                  <span className="text-[10px] font-bold uppercase leading-tight tracking-[0.12em] text-neutral-950">
                    Dentist
                    <br />
                    approved
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
