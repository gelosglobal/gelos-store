import type { SmileScan as PrismaSmileScan } from '@prisma/client'
import { formatOrderDateLabel } from '@/lib/admin/order-format'
import type { SmileScanReport } from '@/lib/gelos-ai/smile-scan-types'
import { isDatabaseConfigured } from '@/lib/env'
import { prisma } from '@/lib/prisma'
import type { AdminSmileScan } from '@/lib/types/smile-scan'

function asSmileScanReport(value: unknown): SmileScanReport {
  const report = (value ?? {}) as Partial<SmileScanReport>
  return {
    snapshot: String(report.snapshot ?? ''),
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

function prismaToAdminSmileScan(record: PrismaSmileScan): AdminSmileScan {
  return {
    id: record.id,
    scanId: record.scanId,
    customerName: record.customerName || 'Guest',
    sessionId: record.sessionId ?? undefined,
    report: asSmileScanReport(record.report),
    brightness: record.brightness,
    freshness: record.freshness,
    confidence: record.confidence,
    overallScore: record.overallScore,
    productCount: record.productCount,
    createdAt: record.createdAt.toISOString(),
    dateLabel: formatOrderDateLabel(record.createdAt),
  }
}

export async function listAdminSmileScans(): Promise<AdminSmileScan[]> {
  if (!isDatabaseConfigured()) return []

  const scans = await prisma.smileScan.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return scans.map(prismaToAdminSmileScan)
}
