import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { isDatabaseConfigured } from '@/lib/env'
import type { SmileScanReport } from '@/lib/gelos-ai/smile-scan-types'

export function generateSmileScanId(): string {
  const suffix = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `SCAN-${suffix}-${rand}`
}

function averageScore(scores: SmileScanReport['scores']): number {
  const values = [scores.brightness, scores.freshness, scores.confidence].filter(
    (value) => value > 0,
  )
  if (!values.length) return 0
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
}

export type CreateSmileScanInput = {
  customerName: string
  sessionId?: string
  report: SmileScanReport
}

export async function createSmileScan(input: CreateSmileScanInput) {
  const scanId = generateSmileScanId()
  const overallScore = averageScore(input.report.scores)

  if (!isDatabaseConfigured()) {
    return { scanId, persisted: false as const }
  }

  const record = await prisma.smileScan.create({
    data: {
      scanId,
      customerName: input.customerName.trim(),
      sessionId: input.sessionId?.trim() || null,
      report: input.report as Prisma.InputJsonValue,
      brightness: input.report.scores.brightness,
      freshness: input.report.scores.freshness,
      confidence: input.report.scores.confidence,
      overallScore,
      productCount: input.report.products.length,
    },
  })

  return { scanId: record.scanId, persisted: true as const }
}
