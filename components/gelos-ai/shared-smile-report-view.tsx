'use client'

import Link from 'next/link'
import { Loader2, ScanFace } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ScanYourSmileCta } from '@/components/gelos-ai/scan-your-smile-cta'
import { SmileReportCard } from '@/components/gelos-ai/smile-report-card'
import { SiteFooter } from '@/components/site-footer'
import type { SmileScanReport } from '@/lib/gelos-ai/smile-scan-types'

type SharedScan = {
  scanId: string
  customerName: string
  report: SmileScanReport
}

type ViewState =
  | { status: 'loading' }
  | { status: 'ready'; scan: SharedScan }
  | { status: 'not-found' }
  | { status: 'error' }

export function SharedSmileReportView({ scanId }: { scanId: string }) {
  const [state, setState] = useState<ViewState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const res = await fetch(
          `/api/store/smile-scans/${encodeURIComponent(scanId)}`,
          { cache: 'no-store' },
        )
        const data = (await res.json()) as {
          scan?: SharedScan
          error?: string
        }

        if (cancelled) return

        if (res.ok && data.scan) {
          setState({ status: 'ready', scan: data.scan })
          return
        }

        if (res.status === 404) {
          setState({ status: 'not-found' })
          return
        }

        setState({ status: 'error' })
      } catch {
        if (!cancelled) setState({ status: 'error' })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [scanId])

  return (
    <div className="min-h-screen bg-neutral-50">
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        {state.status === 'loading' && (
          <div className="flex min-h-[20rem] flex-col items-center justify-center rounded-2xl border border-neutral-200 bg-white px-6 text-center">
            <Loader2 className="mb-3 h-10 w-10 animate-spin text-[#84CC16]" />
            <p className="text-sm font-medium text-foreground">Loading smile report…</p>
          </div>
        )}

        {state.status === 'not-found' && (
          <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center">
            <ScanFace className="mx-auto mb-3 h-10 w-10 text-neutral-300" />
            <h1 className="text-xl font-semibold text-foreground">Report not found</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This smile report link may have expired or was not saved. Ask the sender to
              share again after scanning on Gelos AI.
            </p>
            <Link
              href="/ai?tab=scan"
              className="mt-6 inline-flex rounded-full bg-[#84CC16] px-5 py-2.5 text-sm font-semibold text-neutral-950 hover:bg-[#73b512]"
            >
              Scan your smile
            </Link>
          </div>
        )}

        {state.status === 'error' && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <h1 className="text-xl font-semibold text-red-950">Could not load report</h1>
            <p className="mt-2 text-sm text-red-900/80">
              Something went wrong loading this shared report. Please try again in a moment.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex rounded-full bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800"
              >
                Reload
              </button>
              <Link
                href="/ai?tab=scan"
                className="inline-flex rounded-full border border-neutral-300 bg-white px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-neutral-50"
              >
                Scan your smile instead
              </Link>
            </div>
          </div>
        )}

        {state.status === 'ready' && (
          <>
            <ScanYourSmileCta variant="banner" className="mb-6" />

            <div className="mb-6 flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#84CC16]/20 text-neutral-900">
                <ScanFace className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Gelos Smile Report</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Shared smile wellness insights from Gelos AI
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <SmileReportCard
                report={state.scan.report}
                customerName={state.scan.customerName}
                scanId={state.scan.scanId}
                showShare={false}
              />
            </div>

            <ScanYourSmileCta variant="card" className="mt-6" />
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}
