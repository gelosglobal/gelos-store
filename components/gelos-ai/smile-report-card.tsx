'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Lightbulb,
  Sparkles,
  Stethoscope,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { ShareSmileReportButton } from '@/components/gelos-ai/share-smile-report-button'
import { useProducts } from '@/components/products-provider'
import { SmileScoreGauge } from '@/components/smile-results/smile-score-gauge'
import { SmileTestBundleBuilder } from '@/components/smile-test/smile-test-bundle-builder'
import { SmileTestProductMatchSection } from '@/components/smile-test/smile-test-product-match'
import { buildSmileScanDetailedResults } from '@/lib/gelos-ai/smile-scan-results'
import type { SmileScanReport } from '@/lib/gelos-ai/smile-scan-types'
import { cn } from '@/lib/utils'

export function SmileReportCard({
  report,
  customerName,
  scanId,
  showShare = true,
}: {
  report: SmileScanReport
  customerName?: string
  scanId?: string
  showShare?: boolean
}) {
  const { products } = useProducts()
  const [routineTab, setRoutineTab] = useState<'morning' | 'night'>('morning')

  const firstName = customerName?.trim().split(/\s+/)[0]
  const quality = report.imageQuality
  const lowQuality = quality?.analyzable === false
  const hasScores =
    report.scores.brightness + report.scores.freshness + report.scores.confidence > 0

  const detailed = useMemo(
    () => (hasScores && !lowQuality ? buildSmileScanDetailedResults(report, products) : null),
    [hasScores, lowQuality, products, report],
  )

  const activeRoutine =
    routineTab === 'morning'
      ? detailed?.morningRoutine ?? []
      : detailed?.nightRoutine ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
            Your smile scan results ✨
          </h3>
          <p className="mt-2 text-sm text-neutral-600 sm:text-base">
            {firstName
              ? `${firstName}, here's your AI visual report and personalized picks.`
              : "Here's your AI visual report and personalized picks."}
          </p>
        </div>
        {showShare ? (
          <ShareSmileReportButton
            report={report}
            customerName={customerName}
            scanId={scanId}
          />
        ) : null}
      </div>

      {lowQuality && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <h4 className="text-sm font-semibold text-amber-950">
                Photo not clear enough to score
              </h4>
              <p className="mt-1 text-sm leading-relaxed text-amber-900/90">
                We will not guess a score from a blurry or unclear image. Retake your photo
                for an accurate, honest report.
              </p>
              {quality?.issues && quality.issues.length > 0 ? (
                <ul className="mt-2 list-inside list-disc text-xs text-amber-900/80">
                  {quality.issues.map((issue) => (
                    <li key={issue} className="capitalize">
                      {issue}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-[1.75rem] border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#8B5CF6]" />
          <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
            {firstName ? `${firstName}'s smile snapshot` : 'Smile snapshot'}
          </h4>
        </div>
        <p className="text-sm leading-relaxed text-neutral-800">{report.snapshot}</p>
      </div>

      {detailed ? (
        <>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="rounded-[1.75rem] border border-neutral-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
                Your smile score
              </p>
              <SmileScoreGauge score={detailed.score} />

              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
                  Scan focus
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {detailed.goalLabels.map((label) => (
                    <span
                      key={label}
                      className="rounded-full border border-[#C4B5FD] bg-[#F5F3FF] px-3 py-1.5 text-xs font-semibold text-[#6D28D9]"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
                  Focus areas
                </p>
                <ul className="mt-3 space-y-2">
                  {detailed.focusAreas.map((area) => (
                    <li key={area} className="flex items-start gap-2 text-sm text-neutral-700">
                      <Check className="mt-0.5 size-4 shrink-0 text-[#84CC16]" />
                      {area}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="flex gap-2 rounded-full bg-neutral-100 p-1">
                {(['morning', 'night'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setRoutineTab(tab)}
                    className={cn(
                      'flex-1 rounded-full px-4 py-2 text-sm font-semibold capitalize transition-colors',
                      routineTab === tab
                        ? 'bg-white text-neutral-950 shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-800',
                    )}
                  >
                    {tab} routine
                  </button>
                ))}
              </div>

              <ol className="mt-5 space-y-3">
                {activeRoutine.map((step, index) => {
                  const product = products.find((item) => item.id === step.productId)
                  return (
                    <li
                      key={`${step.productId}-${index}`}
                      className="flex items-center gap-3 rounded-2xl border border-neutral-100 bg-[#F7FBFE] p-3"
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#EDE9FE] text-sm font-bold text-[#7C3AED]">
                        {index + 1}
                      </span>
                      <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-white">
                        {product?.image ? (
                          <Image
                            src={product.image}
                            alt={step.label}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-neutral-950">
                          {product?.name ?? step.label}
                        </p>
                        <p className="text-xs text-neutral-500">{step.duration}</p>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </div>
          </div>

          {detailed.productMatches.length > 0 ? (
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
              <SmileTestProductMatchSection matches={detailed.productMatches} />
              <SmileTestBundleBuilder
                bundleProductIds={detailed.bundleProductIds}
                goalLabels={detailed.goalLabels}
                discountPercent={detailed.bundleDiscountPercent}
              />
            </div>
          ) : null}
        </>
      ) : null}

      {report.tips.length > 0 && (
        <div className="rounded-[1.75rem] border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-neutral-500">
              {lowQuality ? 'How to retake your photo' : 'Gentle tips'}
            </h4>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {report.tips.map((tip, index) => (
              <div
                key={index}
                className="rounded-2xl border border-neutral-100 bg-[#F7FBFE] p-4"
              >
                <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#EDE9FE] text-xs font-bold text-[#7C3AED]">
                  {index + 1}
                </div>
                <p className="text-sm leading-relaxed text-neutral-700">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-[1.75rem] border border-[#C4B5FD]/40 bg-[#F5F3FF] p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#8B5CF6]/15 text-[#7C3AED]">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold text-neutral-950">When to see a dentist</h4>
            <p className="mt-1 text-sm leading-relaxed text-neutral-600">{report.dentistNote}</p>
            <Link
              href="/book-dentist"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#7C3AED] hover:underline"
            >
              Book a partner dentist
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      <p className="rounded-xl bg-neutral-100 px-3 py-2 text-center text-xs text-neutral-500">
        {report.disclaimer}
      </p>
    </div>
  )
}
