import Link from 'next/link'
import { ArrowRight, ScanFace } from 'lucide-react'
import { cn } from '@/lib/utils'

type ScanYourSmileCtaProps = {
  variant?: 'banner' | 'card'
  className?: string
}

export function ScanYourSmileCta({
  variant = 'card',
  className,
}: ScanYourSmileCtaProps) {
  if (variant === 'banner') {
    return (
      <div
        className={cn(
          'flex flex-col gap-4 rounded-2xl bg-neutral-950 px-5 py-4 text-white sm:flex-row sm:items-center sm:justify-between',
          className,
        )}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#84CC16]/20 text-[#84CC16]">
            <ScanFace className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold">Want your own smile report?</p>
            <p className="mt-1 text-sm text-neutral-300">
              Scan your smile with Gelos AI for personalized scores, tips, and product picks.
            </p>
          </div>
        </div>
        <Link
          href="/ai?tab=scan"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#84CC16] px-5 py-2.5 text-sm font-semibold text-neutral-950 transition-colors hover:bg-[#73b512]"
        >
          Scan my smile
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-2xl border border-[#84CC16]/30 bg-gradient-to-br from-[#84CC16]/15 via-white to-[#4F6CF7]/10 p-6 text-center',
        className,
      )}
    >
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#84CC16]/20 text-neutral-900">
        <ScanFace className="h-6 w-6" />
      </div>
      <h2 className="text-lg font-semibold text-foreground">Ready to scan your smile?</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Get your own AI-powered smile report with honest scores, teeth-care tips, and Gelos
        product recommendations.
      </p>
      <Link
        href="/ai?tab=scan"
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-neutral-950 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
      >
        Scan my smile
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}
