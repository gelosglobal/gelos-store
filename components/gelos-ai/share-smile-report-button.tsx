'use client'

import { Check, Copy, Share2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  buildSmileReportShareUrl,
  formatSmileReportShareText,
} from '@/lib/gelos-ai/format-smile-report-share'
import type { SmileScanReport } from '@/lib/gelos-ai/smile-scan-types'

type ShareSmileReportButtonProps = {
  report: SmileScanReport
  customerName?: string
  scanId?: string
  shareable?: boolean
  className?: string
}

export function ShareSmileReportButton({
  report,
  customerName,
  scanId,
  shareable = Boolean(scanId),
  className,
}: ShareSmileReportButtonProps) {
  const [copied, setCopied] = useState(false)

  const getSharePayload = () => {
    const shareUrl = buildSmileReportShareUrl(
      shareable ? scanId : undefined,
      window.location.origin,
    )
    const text = formatSmileReportShareText({ report, customerName, shareUrl })
    const firstName = customerName?.trim().split(/\s+/)[0]
    const title = firstName ? `${firstName}'s Gelos Smile Report` : 'My Gelos Smile Report'
    return { shareUrl, text, title }
  }

  const shareReport = async () => {
    const { shareUrl, text, title } = getSharePayload()

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text, url: shareUrl })
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
      }
    }

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success('Report copied — paste it anywhere to share')
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not share report. Try again.')
    }
  }

  const copyReport = async () => {
    try {
      const { text } = getSharePayload()
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success('Report copied to clipboard')
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy report')
    }
  }

  const canNativeShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={() => void shareReport()}
          className="rounded-full bg-[#84CC16] text-neutral-950 hover:bg-[#73b512]"
        >
          <Share2 className="h-4 w-4" />
          {canNativeShare ? 'Share report' : 'Copy & share'}
        </Button>
        {canNativeShare && (
          <Button
            type="button"
            variant="outline"
            onClick={() => void copyReport()}
            className="rounded-full"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied' : 'Copy text'}
          </Button>
        )}
      </div>
      {shareable && scanId ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Anyone with the link can view this report.
        </p>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          Share copies your report text. Scan again to get a shareable link.
        </p>
      )}
    </div>
  )
}
