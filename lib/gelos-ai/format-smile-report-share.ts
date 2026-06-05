import type { SmileScanReport } from '@/lib/gelos-ai/smile-scan-types'

function averageScore(scores: SmileScanReport['scores']): number {
  const values = [scores.brightness, scores.freshness, scores.confidence].filter(
    (value) => value > 0,
  )
  if (!values.length) return 0
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
}

export function buildSmileReportShareUrl(scanId?: string, origin?: string): string {
  const base = (origin ?? '').replace(/\/$/, '') || 'https://gelosglobal.com'
  if (scanId) {
    return `${base}/ai/report/${encodeURIComponent(scanId)}`
  }
  return `${base}/ai?tab=scan`
}

export function formatSmileReportShareText({
  report,
  customerName,
  shareUrl,
}: {
  report: SmileScanReport
  customerName?: string
  shareUrl: string
}): string {
  const firstName = customerName?.trim().split(/\s+/)[0]
  const overall = averageScore(report.scores)
  const hasScores = overall > 0
  const title = firstName ? `${firstName}'s Gelos Smile Report` : 'My Gelos Smile Report'

  const lines: string[] = [title, '']

  if (hasScores) {
    lines.push(
      `Overall smile score: ${overall}/10`,
      `Brightness ${report.scores.brightness}/10 · Freshness ${report.scores.freshness}/10 · Smile confidence ${report.scores.confidence}/10`,
      '',
    )
  }

  if (report.snapshot.trim()) {
    lines.push(report.snapshot.trim(), '')
  }

  if (report.tips.length > 0) {
    lines.push('Tips:')
    report.tips.forEach((tip, index) => lines.push(`${index + 1}. ${tip}`))
    lines.push('')
  }

  if (report.products.length > 0) {
    lines.push('Gelos picks:')
    report.products.forEach((product) => lines.push(`• ${product.name}`))
    lines.push('')
  }

  lines.push(`View report: ${shareUrl}`)
  lines.push('', report.disclaimer.trim())

  return lines.join('\n').trim()
}
