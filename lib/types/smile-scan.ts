import type { SmileScanReport } from '@/lib/gelos-ai/smile-scan-types'

export type AdminSmileScan = {
  id: string
  scanId: string
  customerName: string
  sessionId?: string
  report: SmileScanReport
  brightness: number
  freshness: number
  confidence: number
  overallScore: number
  productCount: number
  createdAt: string
  dateLabel: string
}
