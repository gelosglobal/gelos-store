import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  buildSmileScanCatalogContext,
  getSmileScanCatalog,
  resolveSmileScanProducts,
} from '@/lib/gelos-ai/smile-scan-catalog'
import { buildSmileScanSystemPrompt } from '@/lib/gelos-ai/smile-scan-prompt'
import { analyzeSmileImage } from '@/lib/gelos-ai/vision'
import { createSmileScan } from '@/lib/db/smile-scans'
import { isGroqConfigured } from '@/lib/env'

export const dynamic = 'force-dynamic'

const scanRequestSchema = z.object({
  image: z
    .string()
    .min(100)
    .max(4_000_000)
    .refine(
      (value) => value.startsWith('data:image/'),
      'Image must be a data URL',
    ),
  sessionId: z.string().trim().min(1).max(120).optional(),
  name: z.string().trim().min(2).max(80),
  sharpnessScore: z.number().finite().min(0).max(10_000).optional(),
})

export async function POST(request: Request) {
  if (!isGroqConfigured()) {
    return NextResponse.json(
      { error: 'Gelos AI is not available right now.' },
      { status: 503 },
    )
  }

  try {
    const json = await request.json()
    const parsed = scanRequestSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please provide a valid smile photo.' },
        { status: 400 },
      )
    }

    const catalog = await getSmileScanCatalog()
    const customerName = parsed.data.name
    const systemPrompt = buildSmileScanSystemPrompt(
      buildSmileScanCatalogContext(catalog),
      customerName,
    )
    const report = await analyzeSmileImage(
      parsed.data.image,
      systemPrompt,
      customerName,
      parsed.data.sharpnessScore,
    )

    const resolvedReport = {
      ...report,
      products: resolveSmileScanProducts(report.products, catalog, report),
    }

    let saved = { scanId: '', persisted: false as const }
    try {
      saved = await createSmileScan({
        customerName,
        sessionId: parsed.data.sessionId,
        report: resolvedReport,
      })
    } catch (saveError) {
      console.error('[POST /api/gelos-ai/scan-smile] save failed', saveError)
    }

    return NextResponse.json({
      report: resolvedReport,
      scanId: saved.scanId || undefined,
      persisted: saved.persisted,
    })
  } catch (error) {
    console.error('[POST /api/gelos-ai/scan-smile]', error)
    const message =
      error instanceof Error ? error.message : 'Smile scan failed. Please try again.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
