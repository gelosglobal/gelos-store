'use client'

import Link from 'next/link'
import {
  ArrowRight,
  Droplets,
  Lightbulb,
  ShoppingBag,
  Smile,
  Sparkles,
  Stethoscope,
  Sun,
  Wind,
} from 'lucide-react'
import type { SmileScanReport } from '@/lib/gelos-ai/smile-scan-types'
import { cn } from '@/lib/utils'

type ScoreMetric = {
  key: keyof SmileScanReport['scores']
  label: string
  icon: typeof Sun
  color: string
  track: string
}

const scoreMetrics: ScoreMetric[] = [
  {
    key: 'brightness',
    label: 'Brightness',
    icon: Sun,
    color: 'text-amber-500',
    track: 'bg-amber-400',
  },
  {
    key: 'freshness',
    label: 'Freshness',
    icon: Wind,
    color: 'text-sky-500',
    track: 'bg-sky-400',
  },
  {
    key: 'confidence',
    label: 'Smile confidence',
    icon: Smile,
    color: 'text-[#84CC16]',
    track: 'bg-[#84CC16]',
  },
]

function averageScore(scores: SmileScanReport['scores']): number {
  const values = [scores.brightness, scores.freshness, scores.confidence].filter(
    (v) => v > 0,
  )
  if (!values.length) return 0
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length)
}

function ScoreRing({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, (score / 10) * 100))
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference

  return (
    <div className="relative mx-auto h-28 w-28">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden>
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-neutral-200"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-[#84CC16] transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-foreground">{score || '—'}</span>
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          out of 10
        </span>
      </div>
    </div>
  )
}

function ScoreBar({
  label,
  value,
  icon: Icon,
  color,
  track,
}: {
  label: string
  value: number
  icon: typeof Sun
  color: string
  track: string
}) {
  const pct = Math.min(100, Math.max(0, (value / 10) * 100))

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={cn('flex h-8 w-8 items-center justify-center rounded-full bg-neutral-50', color)}>
            <Icon className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
        <span className="text-sm font-semibold text-foreground">{value || '—'}/10</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
        <div
          className={cn('h-full rounded-full transition-all duration-700', track)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function SmileReportCard({ report }: { report: SmileScanReport }) {
  const overall = averageScore(report.scores)
  const hasScores = overall > 0

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-neutral-200 bg-white p-4">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#84CC16]" />
          <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Smile snapshot
          </h4>
        </div>
        <p className="text-sm leading-relaxed text-foreground">{report.snapshot}</p>
      </div>

      {hasScores && (
        <div className="rounded-2xl border border-neutral-200 bg-gradient-to-br from-[#84CC16]/10 via-white to-[#4F6CF7]/10 p-4">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Overall smile score
              </h4>
              <p className="mt-1 text-xs text-muted-foreground">
                Visual estimate from your photo
              </p>
            </div>
            <ScoreRing score={overall} />
          </div>

          <div className="grid gap-3">
            {scoreMetrics.map((metric) => (
              <ScoreBar
                key={metric.key}
                label={metric.label}
                value={report.scores[metric.key]}
                icon={metric.icon}
                color={metric.color}
                track={metric.track}
              />
            ))}
          </div>
        </div>
      )}

      {report.tips.length > 0 && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Gentle tips
            </h4>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {report.tips.map((tip, index) => (
              <div
                key={index}
                className="rounded-xl border border-neutral-100 bg-neutral-50 p-3"
              >
                <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#84CC16] text-xs font-bold text-neutral-950">
                  {index + 1}
                </div>
                <p className="text-sm leading-relaxed text-foreground">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {report.products.length > 0 && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-[#4F6CF7]" />
            <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Gelos picks for you
            </h4>
          </div>
          <div className="space-y-2">
            {report.products.map((product) => (
              <Link
                key={product.href}
                href={product.href}
                className="group flex items-start justify-between gap-3 rounded-xl border border-neutral-100 bg-neutral-50 p-3 transition-colors hover:border-[#84CC16]/40 hover:bg-[#84CC16]/5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Droplets className="h-4 w-4 shrink-0 text-[#4F6CF7]" />
                    <p className="font-medium text-foreground">{product.name}</p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{product.reason}</p>
                </div>
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-[#4F6CF7]/20 bg-[#4F6CF7]/5 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#4F6CF7]/15 text-[#4F6CF7]">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold text-foreground">When to see a dentist</h4>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {report.dentistNote}
            </p>
            <Link
              href="/ai?tab=dentist"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#4F6CF7] hover:underline"
            >
              Book a partner dentist
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      <p className="rounded-xl bg-neutral-100 px-3 py-2 text-center text-xs text-muted-foreground">
        {report.disclaimer}
      </p>
    </div>
  )
}
