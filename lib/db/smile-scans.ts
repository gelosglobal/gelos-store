import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { isDatabaseConfigured } from '@/lib/env'
import type {
  SmileScanImageQuality,
  SmileScanReport,
} from '@/lib/gelos-ai/smile-scan-types'

export type PublicSmileScan = {
  scanId: string
  customerName: string
  report: SmileScanReport
  createdAt: Date
}

function asSmileScanReport(value: unknown): SmileScanReport {
  const report = (value ?? {}) as Partial<SmileScanReport>
  const imageQuality = report.imageQuality as SmileScanImageQuality | undefined

  return {
    snapshot: String(report.snapshot ?? ''),
    imageQuality: imageQuality
      ? {
          analyzable: imageQuality.analyzable !== false,
          clarity: Number(imageQuality.clarity) || 0,
          issues: Array.isArray(imageQuality.issues)
            ? imageQuality.issues.map((issue) => String(issue))
            : [],
        }
      : undefined,
    scores: {
      brightness: Number(report.scores?.brightness) || 0,
      freshness: Number(report.scores?.freshness) || 0,
      confidence: Number(report.scores?.confidence) || 0,
    },
    tips: Array.isArray(report.tips)
      ? report.tips.map((tip) => String(tip))
      : [],
    products: Array.isArray(report.products)
      ? report.products
          .map((product) => {
            if (!product || typeof product !== 'object') return null
            const entry = product as Record<string, unknown>
            const name = String(entry.name ?? '').trim()
            const href = String(entry.href ?? '').trim()
            if (!name || !href) return null
            return {
              name,
              href,
              reason: String(entry.reason ?? 'Recommended for smile care'),
            }
          })
          .filter((product): product is SmileScanReport['products'][number] =>
            Boolean(product),
          )
      : [],
    dentistNote: String(report.dentistNote ?? ''),
    disclaimer: String(
      report.disclaimer ?? 'Visual wellness guide only — not a medical diagnosis.',
    ),
  }
}

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

export async function createSmileScan(
  input: CreateSmileScanInput,
): Promise<{ scanId: string; persisted: true } | { persisted: false }> {
  if (!isDatabaseConfigured()) {
    return { persisted: false }
  }

  const scanId = generateSmileScanId()
  const overallScore = averageScore(input.report.scores)

  const record = await prisma.smileScan.create({
    data: {
      scanId,
      customerName: input.customerName.trim() || 'Guest',
      sessionId: input.sessionId?.trim() || null,
      report: input.report as Prisma.InputJsonValue,
      brightness: input.report.scores.brightness,
      freshness: input.report.scores.freshness,
      confidence: input.report.scores.confidence,
      overallScore,
      productCount: input.report.products.length,
    },
  })

  return { scanId: record.scanId, persisted: true }
}

export async function getSmileScanByScanId(
  scanId: string,
): Promise<PublicSmileScan | null> {
  if (!isDatabaseConfigured() || !scanId.trim()) return null

  try {
    const record = await prisma.smileScan.findUnique({
      where: { scanId: scanId.trim() },
    })

    if (!record) return null

    return {
      scanId: record.scanId,
      customerName: record.customerName || 'Guest',
      report: asSmileScanReport(record.report),
      createdAt: record.createdAt,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    const isNullNameError =
      message.includes('customerName') ||
      (error as { code?: string }).code === 'P2032'

    if (!isNullNameError) {
      console.error('[getSmileScanByScanId]', error)
      return null
    }

    try {
      const result = (await prisma.smileScan.findRaw({
        filter: { scanId: scanId.trim() },
        options: { limit: 1 },
      })) as unknown as Array<{
        scanId: string
        customerName?: string | null
        report: unknown
        createdAt: { $date: string } | string | Date
      }>

      const doc = result[0]
      if (!doc) return null

      const createdAt =
        doc.createdAt instanceof Date
          ? doc.createdAt
          : typeof doc.createdAt === 'string'
            ? new Date(doc.createdAt)
            : new Date(doc.createdAt.$date)

      return {
        scanId: doc.scanId,
        customerName: doc.customerName?.trim() || 'Guest',
        report: asSmileScanReport(doc.report),
        createdAt,
      }
    } catch (rawError) {
      console.error('[getSmileScanByScanId] raw fallback failed', rawError)
      return null
    }
  }
}
