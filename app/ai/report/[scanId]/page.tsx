import Link from 'next/link'
import { ArrowLeft, ScanFace } from 'lucide-react'
import { notFound } from 'next/navigation'
import { SmileReportCard } from '@/components/gelos-ai/smile-report-card'
import { SiteFooter } from '@/components/site-footer'
import { SiteNavbar } from '@/components/site-navbar'
import { getSmileScanByScanId } from '@/lib/db/smile-scans'

type PageProps = {
  params: Promise<{ scanId: string }>
}

export default async function SharedSmileReportPage({ params }: PageProps) {
  const { scanId } = await params
  const scan = await getSmileScanByScanId(scanId)

  if (!scan) notFound()

  return (
    <div className="min-h-screen bg-neutral-50">
      <SiteNavbar />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <Link
          href="/ai?tab=scan"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Scan your own smile
        </Link>

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
            report={scan.report}
            customerName={scan.customerName}
            scanId={scan.scanId}
          />
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
