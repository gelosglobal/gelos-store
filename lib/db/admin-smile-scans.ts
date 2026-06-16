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

export async function repairSmileScansMissingNames(): Promise<void> {
  if (!isDatabaseConfigured()) return

  try {
    await prisma.smileScan.updateMany({
      where: { customerName: null },
      data: { customerName: 'Guest' },
    })
  } catch {
    try {
      await prisma.$runCommandRaw({
        update: 'smile_scans',
        updates: [
          {
            q: { customerName: null },
            u: { $set: { customerName: 'Guest' } },
            multi: true,
          },
        ],
      })
    } catch (error) {
      console.error('[repairSmileScansMissingNames]', error)
    }
  }
}

type RawSmileScanDocument = {
  _id: { $oid: string } | string
  scanId: string
  customerName?: string | null
  sessionId?: string | null
  report: unknown
  brightness?: number | null
  freshness?: number | null
  confidence?: number | null
  overallScore?: number | null
  productCount?: number | null
  createdAt: { $date: string } | string | Date
}

function parseRawDate(value: RawSmileScanDocument['createdAt']): Date {
  if (value instanceof Date) return value
  if (typeof value === 'string') return new Date(value)
  if (value && typeof value === 'object' && '$date' in value) {
    return new Date(value.$date)
  }
  return new Date()
}

function rawToAdminSmileScan(doc: RawSmileScanDocument): AdminSmileScan {
  const createdAt = parseRawDate(doc.createdAt)
  const id =
    typeof doc._id === 'object' && doc._id && '$oid' in doc._id
      ? doc._id.$oid
      : String(doc._id)

  return {
    id,
    scanId: doc.scanId,
    customerName: doc.customerName?.trim() || 'Guest',
    sessionId: doc.sessionId ?? undefined,
    report: asSmileScanReport(doc.report),
    brightness: Number(doc.brightness) || 0,
    freshness: Number(doc.freshness) || 0,
    confidence: Number(doc.confidence) || 0,
    overallScore: Number(doc.overallScore) || 0,
    productCount: Number(doc.productCount) || 0,
    createdAt: createdAt.toISOString(),
    dateLabel: formatOrderDateLabel(createdAt),
  }
}

async function listSmileScansRaw(): Promise<AdminSmileScan[]> {
  const result = (await prisma.smileScan.findRaw({
    options: { sort: { createdAt: -1 } },
  })) as unknown as RawSmileScanDocument[]

  return result.map(rawToAdminSmileScan)
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

  try {
    await repairSmileScansMissingNames()

    const scans = await prisma.smileScan.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return scans.map(prismaToAdminSmileScan)
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    const isNullNameError =
      message.includes('customerName') ||
      (error as { code?: string }).code === 'P2032'

    if (isNullNameError) {
      try {
        return await listSmileScansRaw()
      } catch (rawError) {
        console.error('[listAdminSmileScans] raw fallback failed', rawError)
      }
    }

    console.error('[listAdminSmileScans]', error)
    throw error
  }
}
